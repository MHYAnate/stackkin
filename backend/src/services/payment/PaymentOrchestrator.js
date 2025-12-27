import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';
import { PaymentError, ValidationError, DatabaseError } from '../../errors/index.js';
import PaymentGatewayFactory from './gateways/PaymentGatewayFactory.js';
import CurrencyHandler from '../../utils/currencyHandler.js';

export class PaymentOrchestrator {
  constructor() {
    this.redis = getRedisClient();
    this.steps = [
      'validate_input',
      'generate_idempotency_key',
      'check_idempotency',
      'validate_limits',
      'create_transaction_record',
      'call_gateway',
      'update_transaction_status',
      'notify_user',
      'cleanup_idempotency'
    ];
    
    this.circuitBreaker = new Map();
  }

  async processPayment(paymentData, idempotencyKey = null) {
    const context = {
      paymentData,
      transaction: null,
      gatewayResponse: null,
      gateway: null,
      rollbackActions: [],
      startTime: Date.now()
    };

    try {
      logger.info('Payment orchestration started:', {
        userId: paymentData.userId,
        amount: paymentData.amount,
        idempotencyKey
      });

      for (const step of this.steps) {
        await this.executeStep(step, context, idempotencyKey);
      }

      const result = this.buildSuccessResponse(context);
      
      logger.info('Payment orchestration completed successfully:', {
        transactionId: context.transaction?._id,
        duration: Date.now() - context.startTime
      });

      return result;

    } catch (error) {
      logger.error('Payment orchestration failed:', {
        error: error.message,
        step: context.currentStep,
        userId: paymentData.userId
      });

      await this.rollback(context);
      
      // Check if we should open circuit breaker
      await this.checkCircuitBreaker(context.gateway?.getName());
      
      throw this.transformError(error);
    }
  }

  async executeStep(step, context, idempotencyKey) {
    context.currentStep = step;
    
    logger.debug(`Executing step: ${step}`, {
      userId: context.paymentData.userId
    });

    switch(step) {
      case 'validate_input':
        await this.validateInput(context.paymentData);
        break;
      
      case 'generate_idempotency_key':
        if (!idempotencyKey) {
          idempotencyKey = this.generateIdempotencyKey(context.paymentData);
        }
        context.idempotencyKey = idempotencyKey;
        break;
      
      case 'check_idempotency':
        const cachedResponse = await this.checkIdempotency(context.idempotencyKey);
        if (cachedResponse) {
          logger.info('Idempotent request served from cache:', {
            idempotencyKey: context.idempotencyKey
          });
          throw new PaymentError('Duplicate request', 'IDEMPOTENT_REQUEST', cachedResponse);
        }
        break;
      
      case 'validate_limits':
        await this.validateLimits(context.paymentData);
        break;
      
      case 'create_transaction_record':
        context.transaction = await this.createTransactionRecord(context.paymentData);
        context.rollbackActions.push(() => this.rollbackTransaction(context.transaction));
        break;
      
      case 'call_gateway':
        if (await this.isCircuitBreakerOpen(context.paymentData.gateway)) {
          throw new PaymentError('Payment gateway temporarily unavailable', 'CIRCUIT_BREAKER_OPEN');
        }
        
        context.gateway = PaymentGatewayFactory.create(
          context.paymentData.gateway || 'zainpay'
        );
        
        context.gatewayResponse = await this.callGatewayWithRetry(context);
        context.rollbackActions.push(() => this.rollbackGatewayCall(context));
        break;
      
      case 'update_transaction_status':
        await this.updateTransactionStatus(context.transaction, context.gatewayResponse);
        break;
      
      case 'notify_user':
        await this.notifyUser(context);
        break;
      
      case 'cleanup_idempotency':
        await this.storeIdempotencyResult(context);
        break;
      
      default:
        throw new Error(`Unknown step: ${step}`);
    }
  }

  async validateInput(paymentData) {
    const { userId, amount, currency, paymentMethod } = paymentData;
    
    if (!userId) throw new ValidationError('User ID is required', 'userId');
    if (!amount || amount <= 0) throw new ValidationError('Amount must be positive', 'amount');
    if (!currency) throw new ValidationError('Currency is required', 'currency');
    if (!paymentMethod) throw new ValidationError('Payment method is required', 'paymentMethod');
    
    // Validate amount format
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('Amount must be a valid number', 'amount');
    }
    
    // Validate currency
    const validCurrencies = ['NGN', 'USD', 'GBP', 'EUR'];
    if (!validCurrencies.includes(currency)) {
      throw new ValidationError(`Invalid currency: ${currency}`, 'currency');
    }
    
    // Validate payment method
    const validMethods = ['card', 'virtual_account', 'bank_transfer', 'wallet'];
    if (!validMethods.includes(paymentMethod)) {
      throw new ValidationError(`Invalid payment method: ${paymentMethod}`, 'paymentMethod');
    }
    
    return true;
  }

  generateIdempotencyKey(paymentData) {
    const { userId, amount, currency, paymentMethod, reference } = paymentData;
    const timestamp = Date.now();
    const hash = require('crypto')
      .createHash('md5')
      .update(`${userId}:${amount}:${currency}:${paymentMethod}:${reference || timestamp}`)
      .digest('hex');
    
    return `idempotency:${hash}`;
  }

  async checkIdempotency(key) {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Idempotency check error:', error);
      return null;
    }
  }

  async storeIdempotencyResult(context) {
    if (!context.idempotencyKey) return;
    
    const result = this.buildSuccessResponse(context);
    
    try {
      await this.redis.setex(
        context.idempotencyKey,
        86400, // 24 hours
        JSON.stringify(result)
      );
    } catch (error) {
      logger.error('Failed to store idempotency result:', error);
    }
  }

  async validateLimits(paymentData) {
    const { userId, amount, currency } = paymentData;
    
    // Check daily limit
    const dailyKey = `limits:daily:${userId}:${new Date().toISOString().split('T')[0]}`;
    const dailyAmount = parseInt(await this.redis.get(dailyKey) || '0');
    
    const dailyLimit = parseInt(process.env.DAILY_PAYMENT_LIMIT || '10000000'); // ₦100,000
    
    if (dailyAmount + amount > dailyLimit) {
      throw new ValidationError(
        `Daily payment limit exceeded. Limit: ₦${CurrencyHandler.toNaira(dailyLimit)}, Used: ₦${CurrencyHandler.toNaira(dailyAmount)}`,
        'DAILY_LIMIT_EXCEEDED'
      );
    }
    
    // Check per transaction limit
    const perTransactionLimit = parseInt(process.env.PER_TRANSACTION_LIMIT || '5000000'); // ₦50,000
    if (amount > perTransactionLimit) {
      throw new ValidationError(
        `Transaction amount exceeds limit. Limit: ₦${CurrencyHandler.toNaira(perTransactionLimit)}`,
        'TRANSACTION_LIMIT_EXCEEDED'
      );
    }
    
    return true;
  }

  async createTransactionRecord(paymentData) {
    const Transaction = (await import('../../models/Transaction.js')).default;
    
    const transaction = new Transaction({
      userId: paymentData.userId,
      txnRef: paymentData.reference || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'deposit',
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'pending',
      gateway: paymentData.gateway || 'zainpay',
      paymentMethod: paymentData.paymentMethod,
      description: paymentData.description || `Payment of ${paymentData.amount} ${paymentData.currency}`,
      metadata: paymentData.metadata || {}
    });
    
    await transaction.save();
    return transaction;
  }

  async callGatewayWithRetry(context) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await context.gateway.initializePayment({
          ...context.paymentData,
          reference: context.transaction.txnRef
        });
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          logger.warn(`Gateway call failed, retrying in ${delay}ms:`, {
            attempt,
            error: error.message,
            gateway: context.gateway.getName()
          });
          
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  async updateTransactionStatus(transaction, gatewayResponse) {
    transaction.status = gatewayResponse.success ? 'processing' : 'failed';
    transaction.gatewayRef = gatewayResponse.reference;
    transaction.metadata.gatewayResponse = gatewayResponse;
    
    if (gatewayResponse.accountNumber) {
      transaction.metadata.accountNumber = gatewayResponse.accountNumber;
      transaction.metadata.accountName = gatewayResponse.accountName;
      transaction.metadata.bankName = gatewayResponse.bankName;
    }
    
    if (gatewayResponse.expiresAt) {
      transaction.metadata.expiresAt = gatewayResponse.expiresAt;
    }
    
    await transaction.save();
  }

  async notifyUser(context) {
    // Implementation would depend on your notification service
    const { transaction, gatewayResponse } = context;
    
    logger.info('Payment notification would be sent:', {
      transactionId: transaction._id,
      userId: transaction.userId,
      status: transaction.status
    });
    
    // Example:
    // await notificationService.sendPaymentInitiated(
    //   transaction.userId,
    //   transaction.amount,
    //   transaction.currency,
    //   gatewayResponse
    // );
  }

  async rollback(context) {
    logger.info('Executing rollback actions:', {
      transactionId: context.transaction?._id,
      actionsCount: context.rollbackActions.length
    });
    
    // Execute rollback actions in reverse order
    for (const action of context.rollbackActions.reverse()) {
      try {
        await action();
      } catch (rollbackError) {
        logger.error('Rollback action failed:', rollbackError);
      }
    }
    
    // Update transaction status to failed
    if (context.transaction) {
      try {
        context.transaction.status = 'failed';
        context.transaction.failureReason = context.lastError?.message || 'Rollback executed';
        await context.transaction.save();
      } catch (error) {
        logger.error('Failed to update transaction status during rollback:', error);
      }
    }
  }

  async rollbackTransaction(transaction) {
    if (transaction) {
      transaction.status = 'cancelled';
      transaction.cancelledAt = new Date();
      await transaction.save();
    }
  }

  async rollbackGatewayCall(context) {
    if (context.gatewayResponse?.reference && context.gateway?.refundPayment) {
      try {
        await context.gateway.refundPayment({
          paymentId: context.gatewayResponse.reference,
          amount: context.paymentData.amount,
          reason: 'Rollback due to system error'
        });
      } catch (error) {
        logger.error('Gateway rollback (refund) failed:', error);
      }
    }
  }

  buildSuccessResponse(context) {
    return {
      success: true,
      transactionId: context.transaction._id,
      reference: context.transaction.txnRef,
      gatewayReference: context.gatewayResponse?.reference,
      amount: context.paymentData.amount,
      currency: context.paymentData.currency,
      paymentMethod: context.paymentData.paymentMethod,
      gateway: context.gateway.getName(),
      status: context.transaction.status,
      nextSteps: this.getNextSteps(context),
      timestamp: new Date().toISOString()
    };
  }

  getNextSteps(context) {
    const { gatewayResponse, paymentData } = context;
    
    if (paymentData.paymentMethod === 'virtual_account' && gatewayResponse.accountNumber) {
      return {
        type: 'virtual_account',
        accountNumber: gatewayResponse.accountNumber,
        accountName: gatewayResponse.accountName,
        bankName: gatewayResponse.bankName,
        amount: paymentData.amount,
        instructions: `Transfer exactly ₦${paymentData.amount.toFixed(2)} to the account above.`,
        expiresAt: gatewayResponse.expiresAt
      };
    } else if (paymentData.paymentMethod === 'card' && gatewayResponse.redirectUrl) {
      return {
        type: 'redirect',
        redirectUrl: gatewayResponse.redirectUrl,
        instructions: 'Redirect user to complete card payment'
      };
    }
    
    return { type: 'pending', instructions: 'Payment processing initiated' };
  }

  transformError(error) {
    if (error instanceof PaymentError || error instanceof ValidationError) {
      return error;
    }
    
    // Map common errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new PaymentError(
        'Payment gateway is temporarily unavailable',
        'GATEWAY_UNAVAILABLE',
        { originalError: error.message }
      );
    }
    
    return new PaymentError(
      `Payment processing failed: ${error.message}`,
      'PROCESSING_ERROR',
      { originalError: error.message }
    );
  }

  async checkCircuitBreaker(gatewayName) {
    if (!gatewayName) return;
    
    const key = `circuit_breaker:${gatewayName}`;
    const failures = (this.circuitBreaker.get(key) || 0) + 1;
    
    this.circuitBreaker.set(key, failures);
    
    // If 5 failures in 5 minutes, open circuit breaker for 1 minute
    if (failures >= 5) {
      logger.warn(`Circuit breaker opened for ${gatewayName}`);
      
      setTimeout(() => {
        this.circuitBreaker.delete(key);
        logger.info(`Circuit breaker reset for ${gatewayName}`);
      }, 60000); // 1 minute
    }
  }

  isCircuitBreakerOpen(gatewayName) {
    if (!gatewayName) return false;
    return this.circuitBreaker.get(`circuit_breaker:${gatewayName}`) >= 5;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Verification orchestration
  async verifyPayment(reference, userId) {
    const context = {
      reference,
      userId,
      verificationResponse: null,
      transaction: null
    };

    try {
      // Get transaction from database
      const Transaction = (await import('../../models/Transaction.js')).default;
      context.transaction = await Transaction.findOne({ 
        txnRef: reference,
        userId 
      });

      if (!context.transaction) {
        throw new ValidationError('Transaction not found or access denied', 'TRANSACTION_NOT_FOUND');
      }

      // Get gateway
      const gateway = PaymentGatewayFactory.create(context.transaction.gateway || 'zainpay');
      
      // Verify with gateway
      context.verificationResponse = await gateway.verifyPayment(reference, userId);
      
      // Update transaction status
      await this.updateTransactionFromVerification(context.transaction, context.verificationResponse);
      
      return this.buildVerificationResponse(context);
      
    } catch (error) {
      logger.error('Payment verification failed:', error);
      throw this.transformError(error);
    }
  }

  async updateTransactionFromVerification(transaction, verificationResponse) {
    if (verificationResponse.isSuccessful) {
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.gatewayRef = verificationResponse.paymentRef || verificationResponse.reference;
      
      if (verificationResponse.cardToken) {
        transaction.metadata.cardToken = verificationResponse.cardToken;
      }
    } else if (verificationResponse.status === 'failed') {
      transaction.status = 'failed';
      transaction.failureReason = verificationResponse.message || 'Payment failed';
    } else if (verificationResponse.status === 'expired') {
      transaction.status = 'expired';
    }
    
    await transaction.save();
  }

  buildVerificationResponse(context) {
    return {
      success: context.verificationResponse.isSuccessful,
      transactionId: context.transaction._id,
      reference: context.reference,
      status: context.verificationResponse.status,
      amount: context.verificationResponse.amount,
      transactionDate: context.verificationResponse.transactionDate,
      gatewayResponse: context.verificationResponse.rawResponse,
      timestamp: new Date().toISOString()
    };
  }
}

export default new PaymentOrchestrator();