import axios from 'axios';
import crypto from 'crypto';
import { AppError, PaymentError, ValidationError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import Transaction from '../../models/Transaction.js';
import VirtualAccount from '../../models/VirtualAccount.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import notificationService from '../notification/notification.service.js';
import emailService from '../notification/email.service.js';

class ZainpayService {
  constructor() {
    this.baseUrl = process.env.ZAINPAY_SANDBOX === 'true' 
      ? 'https://sandbox-api.zainpay.ng'
      : 'https://api.zainpay.ng';
    
    this.publicKey = process.env.ZAINPAY_PUBLIC_KEY;
    this.secretKey = process.env.ZAINPAY_SECRET_KEY;
    this.zainboxCode = process.env.ZAINPAY_ZAINBOX_CODE;
    this.webhookSecret = process.env.ZAINPAY_WEBHOOK_SECRET;
    this.callbackUrl = process.env.ZAINPAY_CALLBACK_URL || `${process.env.API_URL}/webhooks/zainpay`;
    
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.publicKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // ==========================================
  // VERIFICATION METHODS
  // ==========================================

  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Verify webhook signature error:', error);
      return false;
    }
  }

  // ==========================================
  // DYNAMIC VIRTUAL ACCOUNT METHODS
  // ==========================================

  async createDynamicVirtualAccount(data) {
    try {
      const { userId, amount, email, duration = 1800, metadata = {} } = data;
      
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Generate unique transaction reference
      const txnRef = `DVA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // Convert amount to kobo (Zainpay expects kobo for transfers)
      const amountInKobo = Math.round(amount * 100);
      
      const requestData = {
        bankType: 'gtBank',
        amount: amountInKobo.toString(),
        zainboxCode: this.zainboxCode,
        txnRef,
        duration: duration.toString(),
        accountName: 'Stackkin Checkout',
        callBackUrl: `${this.callbackUrl}/dva-callback`,
        email,
        metadata: JSON.stringify(metadata)
      };
      
      logger.info('Creating DVA request:', { 
        userId, 
        txnRef, 
        amount 
      });
      
      const response = await this.axios.post(
        '/virtual-account/dynamic/create/request',
        requestData
      );
      
      if (!response.data || response.data.responseCode !== '00') {
        throw new PaymentError(
          `Failed to create DVA: ${response.data?.responseMessage || 'Unknown error'}`
        );
      }
      
      // Save virtual account to database
      const virtualAccount = await VirtualAccount.create({
        userId,
        accountNumber: response.data.accountNumber,
        accountName: response.data.accountName,
        bankName: response.data.bankName,
        bankCode: '058', // GTBank code
        zainboxCode: this.zainboxCode,
        txnRef,
        amount,
        amountInKobo,
        status: 'pending',
        expiresAt: new Date(Date.now() + duration * 1000),
        duration,
        email,
        metadata,
        isDynamic: true
      });
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId,
        txnRef,
        type: 'deposit',
        amount,
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'virtual_account',
        description: `Virtual account payment for ₦${amount.toFixed(2)}`,
        metadata: {
          ...metadata,
          virtualAccountId: virtualAccount._id
        }
      });
      
      // Create payment record
      await Payment.create({
        userId,
        transactionId: transaction._id,
        virtualAccountId: virtualAccount._id,
        amount,
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'virtual_account',
        gatewayRef: txnRef,
        metadata
      });
      
      const result = {
        success: true,
        virtualAccountId: virtualAccount._id,
        transactionId: transaction._id,
        accountNumber: response.data.accountNumber,
        accountName: response.data.accountName,
        bankName: response.data.bankName,
        txnRef,
        amount,
        amountInKobo,
        expiresAt: virtualAccount.expiresAt,
        timeRemaining: virtualAccount.timeRemaining,
        instructions: `Transfer exactly ₦${amount.toFixed(2)} to the account above. The account expires in ${Math.floor(duration / 60)} minutes.`
      };
      
      logger.info('DVA created successfully:', { 
        userId, 
        txnRef, 
        accountNumber: result.accountNumber 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Create DVA error:', error);
      
      if (error.response) {
        throw new PaymentError(
          `Zainpay API error: ${error.response.data?.responseMessage || error.message}`,
          error.response.data?.responseCode
        );
      }
      
      throw new PaymentError(`Failed to create DVA: ${error.message}`);
    }
  }

  async checkDynamicVirtualAccountStatus(txnRef, userId = null) {
    try {
      const response = await this.axios.get(
        `/virtual-account/dynamic/deposit/status/${txnRef}`
      );
      
      if (!response.data) {
        throw new PaymentError('Invalid response from Zainpay');
      }
      
      const status = response.data.status || 'pending';
      const isSuccessful = status === 'success';
      
      // Find virtual account and update status
      const virtualAccount = await VirtualAccount.findOne({ txnRef });
      if (virtualAccount) {
        virtualAccount.status = status;
        virtualAccount.depositedAmount = response.data.depositedAmount 
          ? parseFloat(response.data.depositedAmount) / 100 
          : 0;
        virtualAccount.senderName = response.data.senderName;
        virtualAccount.bankName = response.data.bankName;
        
        if (isSuccessful && !virtualAccount.completedAt) {
          virtualAccount.completedAt = new Date();
        }
        
        await virtualAccount.save();
      }
      
      // Find and update transaction
      const transaction = await Transaction.findOne({ txnRef });
      if (transaction) {
        transaction.status = isSuccessful ? 'success' : status;
        transaction.gatewayRef = response.data.paymentRef;
        
        if (isSuccessful) {
          transaction.completedAt = new Date();
          transaction.description = `Payment completed via ${response.data.bankName}`;
        }
        
        await transaction.save();
        
        // Update related payment record
        if (isSuccessful) {
          await Payment.findOneAndUpdate(
            { transactionId: transaction._id },
            { 
              status: 'completed',
              gatewayRef: response.data.paymentRef
            }
          );
          
          // Notify user of successful payment
          if (transaction.userId) {
            const user = await User.findById(transaction.userId);
            if (user) {
              await notificationService.createNotification({
                userId: user._id,
                type: 'payment_success',
                title: 'Payment Successful',
                message: `Your payment of ₦${transaction.amount.toFixed(2)} has been completed successfully.`,
                data: { transactionId: transaction._id, amount: transaction.amount }
              });
              
              await emailService.sendPaymentConfirmation(
                user.email,
                user.firstName,
                transaction.amount,
                transaction.txnRef
              );
            }
          }
        }
      }
      
      const result = {
        txnRef,
        status,
        isSuccessful,
        amount: response.data.amount ? parseFloat(response.data.amount) / 100 : 0,
        depositedAmount: response.data.depositedAmount ? parseFloat(response.data.depositedAmount) / 100 : 0,
        transactionDate: response.data.transactionDate,
        senderName: response.data.senderName,
        bankName: response.data.bankName,
        rawResponse: response.data
      };
      
      logger.info('DVA status checked:', { txnRef, status, userId });
      return result;
      
    } catch (error) {
      logger.error('Check DVA status error:', error);
      
      if (error.response) {
        throw new PaymentError(
          `Zainpay API error: ${error.response.data?.responseMessage || error.message}`,
          error.response.data?.responseCode
        );
      }
      
      throw new PaymentError(`Failed to check DVA status: ${error.message}`);
    }
  }

  // ==========================================
  // CARD PAYMENT METHODS
  // ==========================================

  async initializeCardPayment(data) {
    try {
      const { userId, amount, email, phone, metadata = {} } = data;
      
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Generate unique transaction reference
      const txnRef = `CARD_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // Card payments use Naira (not kobo)
      const amountInNaira = amount.toFixed(2);
      
      const requestData = {
        amount: amountInNaira,
        txnRef,
        zainboxCode: this.zainboxCode,
        emailAddress: email,
        mobileNumber: phone || '',
        callBackUrl: `${this.callbackUrl}/card-callback`,
        allowRecurringPayment: false,
        logoUrl: `${process.env.CLIENT_URL}/logo.png`,
        metadata: JSON.stringify(metadata)
      };
      
      logger.info('Initializing card payment:', { 
        userId, 
        txnRef, 
        amount 
      });
      
      const response = await this.axios.post(
        '/zainbox/card/initialize/payment',
        requestData
      );
      
      if (!response.data || !response.data.data) {
        throw new PaymentError(
          `Failed to initialize card payment: ${response.data?.responseMessage || 'Unknown error'}`
        );
      }
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId,
        txnRef,
        type: 'deposit',
        amount,
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'card',
        description: `Card payment for ₦${amount.toFixed(2)}`,
        metadata
      });
      
      // Create payment record
      await Payment.create({
        userId,
        transactionId: transaction._id,
        amount,
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'card',
        gatewayRef: txnRef,
        metadata
      });
      
      const result = {
        success: true,
        transactionId: transaction._id,
        redirectUrl: response.data.data,
        txnRef,
        amount,
        amountInNaira,
        paymentUrl: response.data.data
      };
      
      logger.info('Card payment initialized successfully:', { 
        userId, 
        txnRef 
      });
      return result;
      
    } catch (error) {
      logger.error('Initialize card payment error:', error);
      
      if (error.response) {
        throw new PaymentError(
          `Zainpay API error: ${error.response.data?.responseMessage || error.message}`,
          error.response.data?.responseCode
        );
      }
      
      throw new PaymentError(`Failed to initialize card payment: ${error.message}`);
    }
  }

  async verifyCardPayment(txnRef, userId = null) {
    try {
      const response = await this.axios.get(
        `/virtual-account/wallet/deposit/verify/${txnRef}`
      );
      
      if (!response.data) {
        throw new PaymentError('Invalid response from Zainpay');
      }
      
      const status = response.data.status || 'pending';
      const isSuccessful = status === 'success';
      
      // Find and update transaction
      const transaction = await Transaction.findOne({ txnRef });
      if (transaction) {
        transaction.status = isSuccessful ? 'success' : status;
        transaction.gatewayRef = response.data.paymentRef;
        transaction.cardToken = response.data.cardToken;
        
        if (isSuccessful) {
          transaction.completedAt = new Date();
          transaction.description = `Card payment completed`;
        }
        
        await transaction.save();
        
        // Update related payment record
        if (isSuccessful) {
          await Payment.findOneAndUpdate(
            { transactionId: transaction._id },
            { 
              status: 'completed',
              gatewayRef: response.data.paymentRef
            }
          );
          
          // Save card token for recurring payments if present
          if (response.data.cardToken && transaction.userId) {
            await this.saveCardToken(transaction.userId, response.data.cardToken);
          }
          
          // Notify user
          if (transaction.userId) {
            const user = await User.findById(transaction.userId);
            if (user) {
              await notificationService.createNotification({
                userId: user._id,
                type: 'payment_success',
                title: 'Card Payment Successful',
                message: `Your card payment of ₦${transaction.amount.toFixed(2)} has been processed.`,
                data: { transactionId: transaction._id }
              });
            }
          }
        }
      }
      
      const result = {
        txnRef,
        status,
        isSuccessful,
        amount: response.data.amount ? parseFloat(response.data.amount) : 0,
        depositedAmount: response.data.depositedAmount ? parseFloat(response.data.depositedAmount) : 0,
        transactionDate: response.data.transactionDate,
        cardToken: response.data.cardToken,
        rawResponse: response.data
      };
      
      logger.info('Card payment verified:', { txnRef, status, userId });
      return result;
      
    } catch (error) {
      logger.error('Verify card payment error:', error);
      
      if (error.response) {
        throw new PaymentError(
          `Zainpay API error: ${error.response.data?.responseMessage || error.message}`,
          error.response.data?.responseCode
        );
      }
      
      throw new PaymentError(`Failed to verify card payment: ${error.message}`);
    }
  }

  // ==========================================
  // BANK TRANSFER METHODS
  // ==========================================

  async transferToBank(data) {
    try {
      const { userId, amount, accountNumber, bankCode, accountName, narration, metadata = {} } = data;
      
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Generate unique transaction reference
      const txnRef = `TRF_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // Transfers use kobo
      const amountInKobo = Math.round(amount * 100);
      
      // Get source account from database or configuration
      const sourceAccount = await this.getSourceAccount(userId);
      
      const requestData = {
        amount: amountInKobo.toString(),
        txnRef,
        sourceAccountNumber: sourceAccount,
        beneficiaryAccountNumber: accountNumber,
        beneficiaryBankCode: bankCode,
        beneficiaryAccountName: accountName,
        narration: narration || 'Payment from Stackkin',
        zainboxCode: this.zainboxCode
      };
      
      logger.info('Processing bank transfer:', { 
        userId, 
        txnRef, 
        amount,
        beneficiaryAccount: accountNumber 
      });
      
      const response = await this.axios.post(
        '/bank/transfer/v2',
        requestData
      );
      
      if (!response.data || response.data.responseCode !== '00') {
        throw new PaymentError(
          `Failed to process transfer: ${response.data?.responseMessage || 'Unknown error'}`,
          response.data?.responseCode
        );
      }
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId,
        txnRef,
        type: 'transfer',
        amount,
        status: response.data.status || 'pending',
        gateway: 'zainpay',
        paymentMethod: 'bank_transfer',
        description: `Bank transfer to ${accountName}`,
        beneficiaryAccountNumber: accountNumber,
        beneficiaryAccountName: accountName,
        beneficiaryBankCode: bankCode,
        metadata
      });
      
      const result = {
        success: true,
        transactionId: transaction._id,
        txnRef,
        amount,
        amountInKobo,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        message: response.data.responseMessage,
        status: response.data.status || 'pending'
      };
      
      logger.info('Bank transfer processed successfully:', { 
        userId, 
        txnRef, 
        status: result.status 
      });
      
      return result;
      
    } catch (error) {
      logger.error('Bank transfer error:', error);
      
      if (error.response) {
        const errorCode = error.response.data?.responseCode;
        const errorMessage = error.response.data?.responseMessage || error.message;
        
        // Log failed transfer to database
        if (data.userId) {
          await Transaction.create({
            userId: data.userId,
            txnRef: data.txnRef || `TRF_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            type: 'transfer',
            amount: data.amount,
            status: 'failed',
            gateway: 'zainpay',
            paymentMethod: 'bank_transfer',
            description: `Failed bank transfer to ${data.accountName}`,
            beneficiaryAccountNumber: data.accountNumber,
            beneficiaryAccountName: data.accountName,
            beneficiaryBankCode: data.bankCode,
            failureReason: errorMessage,
            metadata: data.metadata || {}
          });
        }
        
        throw new PaymentError(`Zainpay transfer error: ${errorMessage}`, errorCode);
      }
      
      throw new PaymentError(`Failed to process bank transfer: ${error.message}`);
    }
  }

  async verifyTransfer(txnRef, userId = null) {
    try {
      const response = await this.axios.get(
        `/virtual-account/wallet/transaction/verify/${txnRef}`
      );
      
      if (!response.data) {
        throw new PaymentError('Invalid response from Zainpay');
      }
      
      const status = response.data.status || 'pending';
      const isSuccessful = status === 'success';
      
      // Find and update transaction
      const transaction = await Transaction.findOne({ txnRef });
      if (transaction) {
        transaction.status = isSuccessful ? 'success' : status;
        transaction.gatewayRef = response.data.paymentRef;
        transaction.beneficiaryAccountNumber = response.data.beneficiaryAccountNumber;
        transaction.beneficiaryBankCode = response.data.beneficiaryBankCode;
        
        if (isSuccessful) {
          transaction.completedAt = new Date();
          transaction.settledAt = new Date(response.data.transactionDate);
        }
        
        await transaction.save();
      }
      
      const result = {
        txnRef,
        status,
        isSuccessful,
        amount: response.data.amount ? parseFloat(response.data.amount) : 0,
        beneficiaryAccountNumber: response.data.beneficiaryAccountNumber,
        beneficiaryBankCode: response.data.beneficiaryBankCode,
        transactionDate: response.data.transactionDate,
        rawResponse: response.data
      };
      
      logger.info('Transfer verified:', { txnRef, status, userId });
      return result;
      
    } catch (error) {
      logger.error('Verify transfer error:', error);
      
      if (error.response) {
        throw new PaymentError(
          `Zainpay API error: ${error.response.data?.responseMessage || error.message}`,
          error.response.data?.responseCode
        );
      }
      
      throw new PaymentError(`Failed to verify transfer: ${error.message}`);
    }
  }

  // ==========================================
  // WEBHOOK PROCESSING
  // ==========================================

  async processWebhookEvent(event, data, signature) {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(data, signature)) {
        throw new PaymentError('Invalid webhook signature');
      }
      
      logger.info('Processing Zainpay webhook event:', { 
        event, 
        txnRef: data.txnRef,
        amount: data.amount 
      });
      
      switch (event) {
        case 'deposit.success':
          await this.handleDepositSuccess(data);
          break;
          
        case 'transfer.success':
          await this.handleTransferSuccess(data);
          break;
          
        case 'transfer.failed':
          await this.handleTransferFailed(data);
          break;
          
        default:
          logger.warn('Unknown webhook event:', event);
      }
      
      return { processed: true, event };
      
    } catch (error) {
      logger.error('Process webhook event error:', error);
      
      // Log webhook processing failure
      await Transaction.create({
        txnRef: `WEBHOOK_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        type: 'deposit',
        amount: 0,
        status: 'failed',
        gateway: 'zainpay',
        paymentMethod: 'webhook',
        description: `Webhook processing failed for event: ${event}`,
        failureReason: error.message,
        webhookData: { event, data, signature }
      });
      
      throw error;
    }
  }

  async handleDepositSuccess(data) {
    try {
      const { txnRef, depositedAmount, paymentRef, cardToken, senderName, beneficiaryAccountNumber } = data;
      
      logger.info('Processing deposit success:', { txnRef, amount: depositedAmount });
      
      // Find virtual account by account number or txnRef
      let virtualAccount = await VirtualAccount.findOne({ 
        $or: [
          { accountNumber: beneficiaryAccountNumber },
          { txnRef: txnRef }
        ]
      });
      
      if (virtualAccount) {
        // Update virtual account with successful payment
        virtualAccount.status = 'success';
        virtualAccount.depositedAmount = depositedAmount ? parseFloat(depositedAmount) / 100 : 0;
        virtualAccount.senderName = senderName;
        virtualAccount.completedAt = new Date();
        await virtualAccount.save();
        
        // Update transaction record
        const transaction = await Transaction.findOne({ txnRef: virtualAccount.txnRef });
        if (transaction) {
          transaction.status = 'success';
          transaction.gatewayRef = paymentRef;
          transaction.completedAt = new Date();
          transaction.webhookData = data;
          await transaction.save();
          
          // Update related payment record
          await Payment.findOneAndUpdate(
            { transactionId: transaction._id },
            { 
              status: 'completed',
              gatewayRef: paymentRef
            }
          );
          
          // Notify user
          if (transaction.userId) {
            const user = await User.findById(transaction.userId);
            if (user) {
              await notificationService.createNotification({
                userId: user._id,
                type: 'payment_success',
                title: 'Payment Received',
                message: `Your payment of ₦${virtualAccount.depositedAmount.toFixed(2)} has been received and confirmed.`,
                data: { 
                  transactionId: transaction._id,
                  virtualAccountId: virtualAccount._id,
                  amount: virtualAccount.depositedAmount 
                }
              });
              
              // Send email notification
              await emailService.sendPaymentConfirmation(
                user.email,
                user.firstName,
                virtualAccount.depositedAmount,
                txnRef
              );
            }
          }
        }
      }
      
      // If card token is present, save it for recurring payments
      if (cardToken && virtualAccount?.userId) {
        await this.saveCardToken(virtualAccount.userId, cardToken, txnRef);
      }
      
      logger.info('Deposit success handled:', { 
        txnRef, 
        amount: depositedAmount,
        virtualAccountId: virtualAccount?._id 
      });
      
    } catch (error) {
      logger.error('Handle deposit success error:', error);
      
      // Log the error in database
      await Transaction.create({
        txnRef: `ERROR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        type: 'deposit',
        amount: 0,
        status: 'failed',
        gateway: 'zainpay',
        paymentMethod: 'webhook',
        description: `Failed to handle deposit success for txnRef: ${data.txnRef}`,
        failureReason: error.message,
        webhookData: data
      });
      
      throw error;
    }
  }

  async handleTransferSuccess(data) {
    try {
      const { txnRef, amount } = data;
      
      logger.info('Processing transfer success:', { txnRef, amount });
      
      // Update transaction with successful transfer
      const transaction = await Transaction.findOne({ txnRef });
      if (transaction) {
        transaction.status = 'success';
        transaction.completedAt = new Date();
        transaction.webhookData = data;
        await transaction.save();
        
        // Notify user of successful transfer
        if (transaction.userId) {
          const user = await User.findById(transaction.userId);
          if (user) {
            await notificationService.createNotification({
              userId: user._id,
              type: 'transfer_success',
              title: 'Transfer Successful',
              message: `Your transfer of ₦${transaction.amount.toFixed(2)} has been completed successfully.`,
              data: { 
                transactionId: transaction._id,
                amount: transaction.amount 
              }
            });
          }
        }
      }
      
      logger.info('Transfer success handled:', { 
        txnRef, 
        amount: amount?.amount || amount 
      });
      
    } catch (error) {
      logger.error('Handle transfer success error:', error);
      throw error;
    }
  }

  async handleTransferFailed(data) {
    try {
      const { txnRef, amount } = data;
      
      logger.error('Processing transfer failed:', { txnRef, amount });
      
      // Update transaction with failed status
      const transaction = await Transaction.findOne({ txnRef });
      if (transaction) {
        transaction.status = 'failed';
        transaction.failureReason = data.failureReason || 'Transfer failed';
        transaction.webhookData = data;
        await transaction.save();
        
        // Notify user of failed transfer
        if (transaction.userId) {
          const user = await User.findById(transaction.userId);
          if (user) {
            await notificationService.createNotification({
              userId: user._id,
              type: 'transfer_failed',
              title: 'Transfer Failed',
              message: `Your transfer of ₦${transaction.amount.toFixed(2)} has failed. Please try again.`,
              data: { 
                transactionId: transaction._id,
                failureReason: transaction.failureReason 
              }
            });
            
            // Send email to admin for failed transfer
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail) {
              await emailService.sendTransferFailureAlert(
                adminEmail,
                user.email,
                transaction.amount,
                txnRef,
                transaction.failureReason
              );
            }
          }
        }
      }
      
      logger.error('Transfer failed handled:', { 
        txnRef, 
        amount: amount?.amount || amount 
      });
      
    } catch (error) {
      logger.error('Handle transfer failed error:', error);
      throw error;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  async getSourceAccount(userId = null) {
    try {
      // In a real app, you'd get this from your Zainbox configuration or user's virtual account
      // First try to get from environment (default source account)
      const defaultAccount = process.env.ZAINPAY_SOURCE_ACCOUNT;
      
      if (defaultAccount) {
        return defaultAccount;
      }
      
      // If userId provided, try to get user's virtual account
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.virtualAccount) {
          return user.virtualAccount.accountNumber;
        }
      }
      
      // Fallback to a default or throw error
      throw new PaymentError('Source account not configured');
      
    } catch (error) {
      logger.error('Get source account error:', error);
      throw new PaymentError(`Failed to get source account: ${error.message}`);
    }
  }

  async saveCardToken(userId, cardToken, txnRef = null) {
    try {
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Initialize paymentMethods array if it doesn't exist
      if (!user.paymentMethods) {
        user.paymentMethods = [];
      }
      
      // Check if this card token already exists
      const existingToken = user.paymentMethods.find(pm => pm.cardToken === cardToken);
      
      if (!existingToken) {
        // Add new payment method
        user.paymentMethods.push({
          cardToken,
          provider: 'zainpay',
          isDefault: user.paymentMethods.length === 0,
          lastUsed: new Date(),
          metadata: { txnRef }
        });
        
        await user.save();
        
        logger.info('Card token saved for recurring payments:', { 
          userId, 
          tokenPreview: `${cardToken.substring(0, 10)}...`,
          txnRef 
        });
      } else {
        // Update last used date
        existingToken.lastUsed = new Date();
        await user.save();
      }
      
    } catch (error) {
      logger.error('Save card token error:', error);
      throw error;
    }
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      '00': 'Successful',
      '20': 'Invalid Source Account/Zainbox',
      '21': 'Successful Queued Transaction',
      '22': 'Payload Validation Error',
      '23': 'Insufficient Balance',
      '24': 'Invalid Destination Account',
      '25': 'No Wallet Balance',
      '26': 'Duplicate Transaction Ref',
      '27': 'Transfer Application Error',
      '28': 'Inactive Virtual Account',
      '29': 'Application Failure',
      '30': 'Billing Estimation Error'
    };
    
    return errorMessages[errorCode] || 'Unknown error';
  }

  async cleanupExpiredVirtualAccounts() {
    try {
      const expiredCutoff = new Date();
      expiredCutoff.setHours(expiredCutoff.getHours() - 1); // Expired more than 1 hour ago
      
      const result = await VirtualAccount.updateMany(
        {
          status: 'pending',
          expiresAt: { $lt: expiredCutoff }
        },
        {
          $set: { status: 'expired' }
        }
      );
      
      logger.info('Expired virtual accounts cleaned up:', { 
        modifiedCount: result.modifiedCount 
      });
      
      return result.modifiedCount;
      
    } catch (error) {
      logger.error('Cleanup expired virtual accounts error:', error);
      throw error;
    }
  }
}

export default new ZainpayService();