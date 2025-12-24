import logger from '../../config/logger.js';
import axios from 'axios';
import Transaction from '../../models/Transaction.js';
import User from '../../models/User.js';
import { 
  AppError, 
  PaymentError, 
  ValidationError, 
  NotFoundError 
} from '../../errors/index.js';
import zainpayService from './zainpay.service.js';
import notificationService from '../notification/notification.service.js';
import emailService from '../notification/email.service.js';

class TransferService {
  constructor() {
    // Transfer limits (in kobo)
    this.limits = {
      perTransaction: parseInt(process.env.MAX_SINGLE_TRANSACTION) || 50000000, // ₦500,000
      daily: parseInt(process.env.MAX_DAILY_TRANSACTION) || 500000000, // ₦5,000,000
      monthly: parseInt(process.env.MAX_MONTHLY_TRANSACTION) || 5000000000 // ₦50,000,000
    };

    // Transfer fees (in kobo)
    this.fees = {
      fixed: parseInt(process.env.WITHDRAWAL_FEE_FIXED) || 10000, // ₦100
      percentage: parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE) || 0.5
    };

    // Timeouts
    this.timeouts = {
      transfer: parseInt(process.env.TRANSFER_TIMEOUT_HOURS) || 24 * 60 * 60 * 1000 // 24 hours
    };

    // Bank validation cache
    this.bankCache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  // ==========================================
  // BANK VALIDATION
  // ==========================================

  /**
   * Validate bank account details
   */
  async validateBankDetails(accountNumber, bankCode) {
    try {
      const cacheKey = `${bankCode}_${accountNumber}`;
      const cached = this.bankCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        logger.debug('Using cached bank validation:', { accountNumber, bankCode });
        return cached.data;
      }

      // For GTBank (058), we can use Zainpay validation
      // For other banks, we might need different APIs
      let validationResult;
      
      if (bankCode === '058') {
        // Use Zainpay for GTBank validation
        validationResult = await this.validateWithZainpay(accountNumber, bankCode);
      } else {
        // Use Paystack or other service for other banks
        validationResult = await this.validateWithPaystack(accountNumber, bankCode);
      }

      // Cache the result
      this.bankCache.set(cacheKey, {
        data: validationResult,
        timestamp: Date.now()
      });

      return validationResult;

    } catch (error) {
      logger.error('Validate bank details error:', error);
      
      // Return minimal validation if API fails
      return {
        valid: false,
        message: 'Unable to validate bank details at this time',
        accountNumber,
        bankCode
      };
    }
  }

  /**
   * Validate with Zainpay
   */
  async validateWithZainpay(accountNumber, bankCode) {
    try {
      // Note: Zainpay might not have a direct bank validation endpoint
      // We'll implement a simple validation for now
      
      // Basic validation rules
      if (!accountNumber || accountNumber.length < 10) {
        return {
          valid: false,
          message: 'Invalid account number length',
          accountNumber,
          bankCode
        };
      }

      if (!bankCode || bankCode.length !== 3) {
        return {
          valid: false,
          message: 'Invalid bank code',
          accountNumber,
          bankCode
        };
      }

      // For GTBank, account numbers should be 10 digits
      if (bankCode === '058' && accountNumber.length !== 10) {
        return {
          valid: false,
          message: 'GTBank account numbers must be 10 digits',
          accountNumber,
          bankCode
        };
      }

      // All checks passed
      return {
        valid: true,
        message: 'Bank details validated successfully',
        accountNumber,
        bankCode,
        bankName: this.getBankName(bankCode)
      };

    } catch (error) {
      logger.error('Validate with Zainpay error:', error);
      throw error;
    }
  }

  /**
   * Validate with Paystack
   */
  async validateWithPaystack(accountNumber, bankCode) {
    try {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackSecretKey) {
        // Paystack not configured, return basic validation
        return {
          valid: true,
          message: 'Bank details accepted (Paystack not configured)',
          accountNumber,
          bankCode,
          bankName: this.getBankName(bankCode)
        };
      }

      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`
          }
        }
      );

      if (response.data.status && response.data.data) {
        return {
          valid: true,
          message: 'Bank details validated successfully',
          accountNumber,
          bankCode,
          bankName: response.data.data.bank_name,
          accountName: response.data.data.account_name
        };
      } else {
        return {
          valid: false,
          message: response.data.message || 'Invalid bank details',
          accountNumber,
          bankCode
        };
      }

    } catch (error) {
      logger.error('Validate with Paystack error:', error);
      
      // If Paystack fails, return basic validation
      return {
        valid: true,
        message: 'Bank details accepted (validation service unavailable)',
        accountNumber,
        bankCode,
        bankName: this.getBankName(bankCode)
      };
    }
  }

  /**
   * Resolve bank account name
   */
  async resolveAccountName(accountNumber, bankCode) {
    try {
      const validation = await this.validateBankDetails(accountNumber, bankCode);
      
      if (!validation.valid) {
        throw new ValidationError(validation.message);
      }

      // If Paystack provided account name, use it
      if (validation.accountName) {
        return {
          accountName: validation.accountName,
          bankName: validation.bankName,
          accountNumber,
          bankCode
        };
      }

      // Otherwise, we need to ask the user for account name
      // This would be stored and verified later
      return {
        accountName: null,
        bankName: validation.bankName,
        accountNumber,
        bankCode,
        requiresVerification: true
      };

    } catch (error) {
      logger.error('Resolve account name error:', error);
      throw error;
    }
  }

  // ==========================================
  // TRANSFER INITIATION
  // ==========================================

  /**
   * Initiate a bank transfer
   */
  async initiateTransfer(transferData) {
    try {
      const {
        userId,
        amount,
        accountNumber,
        bankCode,
        accountName,
        narration,
        metadata = {}
      } = transferData;

      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.accountStatus !== 'ACTIVE') {
        throw new ValidationError('User account is not active');
      }

      // Validate amount
      this.validateAmount(amount);

      // Check transfer limits
      await this.checkTransferLimits(userId, amount);

      // Validate bank details
      const bankValidation = await this.validateBankDetails(accountNumber, bankCode);
      if (!bankValidation.valid) {
        throw new ValidationError(`Invalid bank details: ${bankValidation.message}`);
      }

      // Calculate fees
      const fees = this.calculateFees(amount);
      const totalAmount = amount + fees.total;

      // Check user balance (this would come from wallet service)
      const hasSufficientBalance = await this.checkUserBalance(userId, totalAmount);
      if (!hasSufficientBalance) {
        throw new PaymentError('Insufficient balance for transfer');
      }

      // Generate unique transaction reference
      const txnRef = `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create transaction record
      const transaction = new Transaction({
        userId,
        txnRef,
        type: 'transfer',
        amount,
        currency: 'NGN',
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'bank_transfer',
        description: narration || `Transfer to ${accountName}`,
        beneficiaryAccountNumber: accountNumber,
        beneficiaryAccountName: accountName || 'Unknown',
        beneficiaryBankCode: bankCode,
        beneficiaryBankName: bankValidation.bankName,
        metadata: {
          ...metadata,
          fees,
          totalAmount,
          bankValidation
        }
      });

      await transaction.save();

      // Process transfer via payment gateway
      const transferResult = await this.processTransfer(transaction, user);

      // Update transaction with gateway response
      transaction.gatewayRef = transferResult.reference;
      transaction.status = transferResult.status;
      transaction.metadata.gatewayResponse = transferResult;
      
      if (transferResult.status === 'success') {
        transaction.completedAt = new Date();
      }
      
      await transaction.save();

      // Deduct from user balance (this would be done by wallet service)
      await this.deductFromBalance(userId, totalAmount, transaction._id);

      // Notify user
      await this.notifyTransferInitiated(user, transaction, transferResult);

      logger.info('Transfer initiated:', {
        userId,
        txnRef,
        amount,
        accountNumber,
        status: transaction.status
      });

      return {
        success: true,
        transactionId: transaction._id,
        txnRef,
        amount,
        fees,
        totalAmount,
        status: transaction.status,
        beneficiary: {
          accountNumber,
          accountName,
          bankName: bankValidation.bankName
        },
        reference: transferResult.reference,
        estimatedArrival: this.getEstimatedArrival(bankCode)
      };

    } catch (error) {
      logger.error('Initiate transfer error:', error);
      
      // If transaction was created, update its status
      if (error.transactionId) {
        await Transaction.findByIdAndUpdate(error.transactionId, {
          status: 'failed',
          failureReason: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Process transfer through payment gateway
   */
  async processTransfer(transaction, user) {
    try {
      const transferData = {
        userId: transaction.userId,
        amount: transaction.amount / 100, // Convert to Naira
        accountNumber: transaction.beneficiaryAccountNumber,
        bankCode: transaction.beneficiaryBankCode,
        accountName: transaction.beneficiaryAccountName,
        narration: transaction.description,
        metadata: {
          transactionId: transaction._id,
          txnRef: transaction.txnRef
        }
      };

      // Use Zainpay for transfers
      const result = await zainpayService.transferToBank(transferData);

      return {
        success: result.success,
        status: result.status,
        reference: result.reference,
        transactionId: result.transactionId,
        message: result.message
      };

    } catch (error) {
      logger.error('Process transfer error:', error);
      
      // Re-throw with transaction ID for error handling
      error.transactionId = transaction._id;
      throw error;
    }
  }

  /**
   * Schedule a transfer for future execution
   */
  async scheduleTransfer(scheduleData) {
    try {
      const {
        userId,
        amount,
        accountNumber,
        bankCode,
        accountName,
        narration,
        scheduleDate,
        metadata = {}
      } = scheduleData;

      // Validate schedule date (must be in the future)
      const scheduleDateTime = new Date(scheduleDate);
      const now = new Date();
      
      if (scheduleDateTime <= now) {
        throw new ValidationError('Schedule date must be in the future');
      }

      // Validate all other transfer data
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      this.validateAmount(amount);

      const bankValidation = await this.validateBankDetails(accountNumber, bankCode);
      if (!bankValidation.valid) {
        throw new ValidationError(`Invalid bank details: ${bankValidation.message}`);
      }

      // Calculate fees
      const fees = this.calculateFees(amount);
      const totalAmount = amount + fees.total;

      // Create scheduled transaction record
      const txnRef = `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction = new Transaction({
        userId,
        txnRef,
        type: 'transfer',
        amount,
        currency: 'NGN',
        status: 'scheduled',
        gateway: 'zainpay',
        paymentMethod: 'bank_transfer',
        description: narration || `Scheduled transfer to ${accountName}`,
        beneficiaryAccountNumber: accountNumber,
        beneficiaryAccountName: accountName || 'Unknown',
        beneficiaryBankCode: bankCode,
        beneficiaryBankName: bankValidation.bankName,
        scheduledAt: scheduleDateTime,
        metadata: {
          ...metadata,
          fees,
          totalAmount,
          bankValidation,
          isScheduled: true
        }
      });

      await transaction.save();

      // Schedule the transfer job
      await this.scheduleTransferJob(transaction, scheduleDateTime);

      logger.info('Transfer scheduled:', {
        userId,
        txnRef,
        amount,
        scheduleDate: scheduleDateTime,
        accountNumber
      });

      return {
        success: true,
        transactionId: transaction._id,
        txnRef,
        amount,
        fees,
        totalAmount,
        status: 'scheduled',
        scheduledAt: scheduleDateTime,
        beneficiary: {
          accountNumber,
          accountName,
          bankName: bankValidation.bankName
        }
      };

    } catch (error) {
      logger.error('Schedule transfer error:', error);
      throw error;
    }
  }

  // ==========================================
  // TRANSFER MANAGEMENT
  // ==========================================

  /**
   * Get transfer by ID
   */
  async getTransferById(transferId, userId = null) {
    try {
      const query = { _id: transferId, type: 'transfer' };
      if (userId) {
        query.userId = userId; // For user-specific lookup
      }

      const transaction = await Transaction.findOne(query)
        .populate('userId', 'firstName lastName username email');

      if (!transaction) {
        throw new NotFoundError('Transfer not found');
      }

      // Enhance with additional data
      const enhancedTransfer = this.enhanceTransferData(transaction);

      return enhancedTransfer;

    } catch (error) {
      logger.error('Get transfer by ID error:', error);
      throw error;
    }
  }

  /**
   * Get user transfer history
   */
  async getUserTransfers(userId, filters = {}) {
    try {
      const { 
        status, 
        startDate, 
        endDate,
        page = 1,
        limit = 20 
      } = filters;

      const skip = (page - 1) * limit;

      const query = { userId, type: 'transfer' };

      if (status) {
        query.status = status;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const [transfers, totalCount] = await Promise.all([
        Transaction.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName username email')
          .lean(),
        Transaction.countDocuments(query)
      ]);

      // Enhance transfer data
      const enhancedTransfers = transfers.map(transfer => 
        this.enhanceTransferData(transfer)
      );

      return {
        transfers: enhancedTransfers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      logger.error('Get user transfers error:', error);
      throw error;
    }
  }

  /**
   * Verify transfer status
   */
  async verifyTransferStatus(txnRef, userId = null) {
    try {
      const query = { txnRef, type: 'transfer' };
      if (userId) {
        query.userId = userId;
      }

      const transaction = await Transaction.findOne(query);
      if (!transaction) {
        throw new NotFoundError('Transfer not found');
      }

      // If transaction is already completed or failed, return current status
      if (['success', 'failed', 'cancelled'].includes(transaction.status)) {
        return this.enhanceTransferData(transaction);
      }

      // Verify with payment gateway
      let gatewayStatus;
      try {
        gatewayStatus = await zainpayService.verifyTransfer(txnRef, userId);
      } catch (gatewayError) {
        logger.error('Gateway verification error:', gatewayError);
        // Return current status if gateway verification fails
        return this.enhanceTransferData(transaction);
      }

      // Update transaction status if changed
      if (gatewayStatus.status !== transaction.status) {
        transaction.status = gatewayStatus.status;
        
        if (gatewayStatus.status === 'success') {
          transaction.completedAt = new Date();
          transaction.settledAt = gatewayStatus.transactionDate ? 
            new Date(gatewayStatus.transactionDate) : new Date();
        }
        
        transaction.metadata.lastVerifiedAt = new Date();
        transaction.metadata.gatewayVerification = gatewayStatus;
        await transaction.save();
      }

      return this.enhanceTransferData(transaction);

    } catch (error) {
      logger.error('Verify transfer status error:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending transfer
   */
  async cancelTransfer(transferId, userId, reason = 'User request') {
    try {
      const transaction = await Transaction.findOne({
        _id: transferId,
        userId,
        type: 'transfer',
        status: { $in: ['pending', 'scheduled'] }
      });

      if (!transaction) {
        throw new NotFoundError('Transfer not found or cannot be cancelled');
      }

      // Update status
      transaction.status = 'cancelled';
      transaction.cancelledAt = new Date();
      transaction.metadata.cancellationReason = reason;
      await transaction.save();

      // If scheduled, cancel the scheduled job
      if (transaction.status === 'scheduled') {
        await this.cancelScheduledJob(transaction._id);
      }

      // Refund any deducted amount
      if (transaction.metadata.amountDeducted) {
        await this.refundDeductedAmount(userId, transaction);
      }

      // Notify user
      const user = await User.findById(userId);
      if (user) {
        await this.notifyTransferCancelled(user, transaction, reason);
      }

      logger.info('Transfer cancelled:', {
        transferId,
        userId,
        reason
      });

      return {
        success: true,
        transactionId: transferId,
        status: 'cancelled',
        message: 'Transfer cancelled successfully'
      };

    } catch (error) {
      logger.error('Cancel transfer error:', error);
      throw error;
    }
  }

  /**
   * Retry a failed transfer
   */
  async retryTransfer(transferId, userId) {
    try {
      const transaction = await Transaction.findOne({
        _id: transferId,
        userId,
        type: 'transfer',
        status: 'failed'
      });

      if (!transaction) {
        throw new NotFoundError('Transfer not found or cannot be retried');
      }

      // Check if retry limit exceeded
      const retryCount = transaction.metadata.retryCount || 0;
      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        throw new ValidationError(
          `Maximum retry limit (${maxRetries}) exceeded for this transfer`
        );
      }

      // Check user balance
      const totalAmount = transaction.metadata.totalAmount || 
                         transaction.amount + this.calculateFees(transaction.amount).total;
      
      const hasSufficientBalance = await this.checkUserBalance(userId, totalAmount);
      if (!hasSufficientBalance) {
        throw new PaymentError('Insufficient balance for retry');
      }

      // Generate new transaction reference for retry
      const newTxnRef = `RETRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new transaction for retry
      const retryTransaction = new Transaction({
        userId,
        txnRef: newTxnRef,
        type: 'transfer',
        amount: transaction.amount,
        currency: transaction.currency,
        status: 'pending',
        gateway: transaction.gateway,
        paymentMethod: transaction.paymentMethod,
        description: `Retry: ${transaction.description}`,
        beneficiaryAccountNumber: transaction.beneficiaryAccountNumber,
        beneficiaryAccountName: transaction.beneficiaryAccountName,
        beneficiaryBankCode: transaction.beneficiaryBankCode,
        beneficiaryBankName: transaction.beneficiaryBankName,
        metadata: {
          ...transaction.metadata,
          retryOf: transaction._id,
          retryCount: retryCount + 1,
          originalTxnRef: transaction.txnRef
        }
      });

      await retryTransaction.save();

      // Process the retry transfer
      const user = await User.findById(userId);
      const transferResult = await this.processTransfer(retryTransaction, user);

      // Update retry transaction
      retryTransaction.gatewayRef = transferResult.reference;
      retryTransaction.status = transferResult.status;
      retryTransaction.metadata.gatewayResponse = transferResult;
      
      if (transferResult.status === 'success') {
        retryTransaction.completedAt = new Date();
      }
      
      await retryTransaction.save();

      // Update original transaction
      transaction.metadata.retried = true;
      transaction.metadata.retryTransactionId = retryTransaction._id;
      await transaction.save();

      logger.info('Transfer retry initiated:', {
        originalTransferId: transferId,
        retryTransactionId: retryTransaction._id,
        status: retryTransaction.status
      });

      return {
        success: true,
        originalTransferId: transferId,
        retryTransactionId: retryTransaction._id,
        txnRef: newTxnRef,
        status: retryTransaction.status
      };

    } catch (error) {
      logger.error('Retry transfer error:', error);
      throw error;
    }
  }

  // ==========================================
  // BATCH PROCESSING & RECONCILIATION
  // ==========================================

  /**
   * Process batch transfers
   */
  async processBatchTransfers(batchData) {
    try {
      const { transfers, batchName, metadata = {} } = batchData;

      if (!Array.isArray(transfers) || transfers.length === 0) {
        throw new ValidationError('No transfers provided in batch');
      }

      // Validate all transfers first
      const validatedTransfers = [];
      const validationErrors = [];

      for (const transfer of transfers) {
        try {
          // Validate transfer data
          this.validateAmount(transfer.amount);
          
          const bankValidation = await this.validateBankDetails(
            transfer.accountNumber,
            transfer.bankCode
          );

          if (!bankValidation.valid) {
            throw new ValidationError(`Invalid bank details: ${bankValidation.message}`);
          }

          // Check user balance
          const fees = this.calculateFees(transfer.amount);
          const totalAmount = transfer.amount + fees.total;
          
          const hasSufficientBalance = await this.checkUserBalance(
            transfer.userId,
            totalAmount
          );

          if (!hasSufficientBalance) {
            throw new PaymentError('Insufficient balance');
          }

          validatedTransfers.push({
            ...transfer,
            bankValidation,
            fees,
            totalAmount,
            status: 'pending'
          });

        } catch (error) {
          validationErrors.push({
            transfer,
            error: error.message
          });
        }
      }

      if (validationErrors.length > 0 && validatedTransfers.length === 0) {
        throw new ValidationError('All transfers failed validation', {
          errors: validationErrors
        });
      }

      // Process validated transfers
      const results = {
        successful: [],
        failed: [],
        validationErrors
      };

      const batchRef = `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const transfer of validatedTransfers) {
        try {
          const user = await User.findById(transfer.userId);
          if (!user) {
            throw new NotFoundError(`User ${transfer.userId} not found`);
          }

          // Create transaction record
          const txnRef = `${batchRef}_${transfer.userId}`;
          
          const transaction = new Transaction({
            userId: transfer.userId,
            txnRef,
            type: 'transfer',
            amount: transfer.amount,
            currency: 'NGN',
            status: 'pending',
            gateway: 'zainpay',
            paymentMethod: 'bank_transfer',
            description: transfer.narration || `Batch transfer from ${batchName}`,
            beneficiaryAccountNumber: transfer.accountNumber,
            beneficiaryAccountName: transfer.accountName,
            beneficiaryBankCode: transfer.bankCode,
            beneficiaryBankName: transfer.bankValidation.bankName,
            metadata: {
              ...metadata,
              batchRef,
              batchName,
              fees: transfer.fees,
              totalAmount: transfer.totalAmount,
              bankValidation: transfer.bankValidation
            }
          });

          await transaction.save();

          // Process transfer
          const transferResult = await this.processTransfer(transaction, user);

          // Update transaction
          transaction.gatewayRef = transferResult.reference;
          transaction.status = transferResult.status;
          transaction.metadata.gatewayResponse = transferResult;
          
          if (transferResult.status === 'success') {
            transaction.completedAt = new Date();
          }
          
          await transaction.save();

          // Deduct from user balance
          await this.deductFromBalance(
            transfer.userId,
            transfer.totalAmount,
            transaction._id
          );

          results.successful.push({
            transactionId: transaction._id,
            txnRef,
            amount: transfer.amount,
            status: transaction.status,
            beneficiary: {
              accountNumber: transfer.accountNumber,
              accountName: transfer.accountName
            }
          });

        } catch (error) {
          results.failed.push({
            transfer,
            error: error.message
          });
        }
      }

      // Create batch summary
      const batchSummary = {
        batchRef,
        batchName,
        totalTransfers: transfers.length,
        successful: results.successful.length,
        failed: results.failed.length,
        validationErrors: results.validationErrors.length,
        totalAmount: results.successful.reduce((sum, t) => sum + t.amount, 0),
        processedAt: new Date()
      };

      logger.info('Batch transfers processed:', batchSummary);

      return {
        batchSummary,
        results
      };

    } catch (error) {
      logger.error('Process batch transfers error:', error);
      throw error;
    }
  }

  /**
   * Reconcile transfers with bank statements
   */
  async reconcileTransfers(reconciliationData) {
    try {
      const { startDate, endDate, bankStatement } = reconciliationData;

      // This would typically involve:
      // 1. Fetching all transfers from the database for the period
      // 2. Comparing with bank statement entries
      // 3. Identifying discrepancies
      // 4. Updating transaction statuses

      const query = {
        type: 'transfer',
        status: { $in: ['pending', 'processing'] },
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      const pendingTransfers = await Transaction.find(query);

      const reconciliationResults = {
        totalTransfers: pendingTransfers.length,
        matched: [],
        unmatched: [],
        errors: []
      };

      for (const transfer of pendingTransfers) {
        try {
          // Find matching entry in bank statement
          const match = bankStatement.find(entry => 
            this.matchTransferWithStatement(transfer, entry)
          );

          if (match) {
            // Update transfer as successful
            transfer.status = 'success';
            transfer.completedAt = new Date(match.date);
            transfer.settledAt = new Date(match.date);
            transfer.metadata.reconciliation = {
              matched: true,
              statementRef: match.reference,
              reconciledAt: new Date()
            };
            await transfer.save();

            reconciliationResults.matched.push({
              transferId: transfer._id,
              txnRef: transfer.txnRef,
              amount: transfer.amount,
              statementRef: match.reference
            });
          } else {
            // Check if transfer should be marked as failed (too old)
            const transferAge = Date.now() - transfer.createdAt;
            if (transferAge > this.timeouts.transfer) {
              transfer.status = 'failed';
              transfer.failureReason = 'Transfer timeout - not found in bank statement';
              transfer.metadata.reconciliation = {
                matched: false,
                reconciledAt: new Date(),
                timeout: true
              };
              await transfer.save();

              reconciliationResults.unmatched.push({
                transferId: transfer._id,
                txnRef: transfer.txnRef,
                amount: transfer.amount,
                reason: 'Timeout'
              });
            } else {
              reconciliationResults.unmatched.push({
                transferId: transfer._id,
                txnRef: transfer.txnRef,
                amount: transfer.amount,
                reason: 'Not yet processed'
              });
            }
          }

        } catch (error) {
          reconciliationResults.errors.push({
            transferId: transfer._id,
            error: error.message
          });
        }
      }

      logger.info('Transfer reconciliation completed:', {
        period: `${startDate} to ${endDate}`,
        ...reconciliationResults
      });

      return reconciliationResults;

    } catch (error) {
      logger.error('Reconcile transfers error:', error);
      throw error;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Validate transfer amount
   */
  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid transfer amount');
    }

    const minAmount = parseInt(process.env.MIN_TRANSACTION_AMOUNT) || 1000;
    if (amount < minAmount) {
      throw new ValidationError(`Minimum transfer amount is ₦${minAmount / 100}`);
    }

    if (amount > this.limits.perTransaction) {
      throw new ValidationError(
        `Maximum single transfer amount is ₦${this.limits.perTransaction / 100}`
      );
    }
  }

  /**
   * Check transfer limits
   */
  async checkTransferLimits(userId, amount) {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Check daily limit
      const dailyTransfers = await Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'transfer',
            status: 'success',
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const dailyTotal = dailyTransfers[0]?.totalAmount || 0;
      if (dailyTotal + amount > this.limits.daily) {
        throw new ValidationError(
          `Daily transfer limit exceeded. Used: ₦${dailyTotal / 100}, Limit: ₦${this.limits.daily / 100}`
        );
      }

      // Check monthly limit
      const monthlyTransfers = await Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'transfer',
            status: 'success',
            createdAt: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const monthlyTotal = monthlyTransfers[0]?.totalAmount || 0;
      if (monthlyTotal + amount > this.limits.monthly) {
        throw new ValidationError(
          `Monthly transfer limit exceeded. Used: ₦${monthlyTotal / 100}, Limit: ₦${this.limits.monthly / 100}`
        );
      }

      return true;

    } catch (error) {
      logger.error('Check transfer limits error:', error);
      throw error;
    }
  }

  /**
   * Calculate transfer fees
   */
  calculateFees(amount) {
    const fixedFee = this.fees.fixed;
    const percentageFee = Math.round(amount * (this.fees.percentage / 100));
    const totalFee = fixedFee + percentageFee;

    return {
      fixed: fixedFee,
      percentage: percentageFee,
      total: totalFee,
      description: `₦${(fixedFee / 100).toFixed(2)} + ${this.fees.percentage}%`
    };
  }

  /**
   * Check user balance
   */
  async checkUserBalance(userId, amount) {
    try {
      // This would integrate with the wallet service
      // For now, we'll use a mock implementation
      const Wallet = (await import('../../models/Wallet.js')).default;
      const wallet = await Wallet.findOne({ userId });
      
      if (!wallet) {
        return false;
      }

      return wallet.availableBalance >= amount;

    } catch (error) {
      logger.error('Check user balance error:', error);
      return false;
    }
  }

  /**
   * Deduct from user balance
   */
  async deductFromBalance(userId, amount, transactionId) {
    try {
      // This would integrate with the wallet service
      const Wallet = (await import('../../models/Wallet.js')).default;
      const wallet = await Wallet.findOne({ userId });
      
      if (!wallet) {
        throw new NotFoundError('Wallet not found');
      }

      if (wallet.availableBalance < amount) {
        throw new PaymentError('Insufficient balance');
      }

      wallet.availableBalance -= amount;
      wallet.lockedBalance += amount; // Lock the amount until transfer completes
      await wallet.save();

      // Record the deduction in transaction metadata
      await Transaction.findByIdAndUpdate(transactionId, {
        $set: {
          'metadata.amountDeducted': true,
          'metadata.deductionTimestamp': new Date()
        }
      });

      return true;

    } catch (error) {
      logger.error('Deduct from balance error:', error);
      throw error;
    }
  }

  /**
   * Refund deducted amount
   */
  async refundDeductedAmount(userId, transaction) {
    try {
      const Wallet = (await import('../../models/Wallet.js')).default;
      const wallet = await Wallet.findOne({ userId });
      
      if (!wallet) {
        return; // Wallet might have been deleted
      }

      const totalAmount = transaction.metadata.totalAmount || 
                         transaction.amount + this.calculateFees(transaction.amount).total;

      wallet.lockedBalance -= totalAmount;
      wallet.availableBalance += totalAmount;
      await wallet.save();

    } catch (error) {
      logger.error('Refund deducted amount error:', error);
      // Don't throw, just log
    }
  }

  /**
   * Get estimated arrival time
   */
  getEstimatedArrival(bankCode) {
    const arrivalTimes = {
      '058': 'Instant', // GTBank
      '011': 'Instant', // First Bank
      '033': 'Instant', // UBA
      '044': 'Instant', // Access Bank
      '014': 'Instant', // Zenith Bank
      'default': 'Within 24 hours'
    };

    return arrivalTimes[bankCode] || arrivalTimes.default;
  }

  /**
   * Enhance transfer data with additional information
   */
  enhanceTransferData(transaction) {
    const now = new Date();
    const isExpired = transaction.status === 'pending' && 
                     (now - transaction.createdAt) > this.timeouts.transfer;

    const enhanced = {
      ...transaction.toObject ? transaction.toObject() : transaction,
      isExpired,
      fees: transaction.metadata?.fees || this.calculateFees(transaction.amount),
      totalAmount: transaction.metadata?.totalAmount || 
                   transaction.amount + this.calculateFees(transaction.amount).total,
      estimatedArrival: this.getEstimatedArrival(transaction.beneficiaryBankCode),
      canRetry: transaction.status === 'failed' && 
                (transaction.metadata?.retryCount || 0) < 3,
      canCancel: ['pending', 'scheduled'].includes(transaction.status)
    };

    return enhanced;
  }

  /**
   * Match transfer with bank statement entry
   */
  matchTransferWithStatement(transfer, statementEntry) {
    // This is a simplified matching logic
    // In production, you would need more sophisticated matching
    return (
      Math.abs(transfer.amount - statementEntry.amount) <= 100 && // Allow 1 Naira difference
      transfer.beneficiaryAccountNumber === statementEntry.accountNumber &&
      (transfer.beneficiaryAccountName?.toLowerCase().includes(statementEntry.name?.toLowerCase()) ||
       statementEntry.name?.toLowerCase().includes(transfer.beneficiaryAccountName?.toLowerCase()))
    );
  }

  /**
   * Get bank name from bank code
   */
  getBankName(bankCode) {
    const banks = {
      '058': 'GTBank',
      '011': 'First Bank',
      '033': 'UBA',
      '044': 'Access Bank',
      '014': 'Zenith Bank',
      '076': 'Polaris Bank',
      '050': 'Ecobank',
      '030': 'Heritage Bank',
      '070': 'Fidelity Bank',
      '032': 'Union Bank',
      '035': 'Wema Bank',
      '057': 'Sterling Bank',
      '068': 'Standard Chartered',
      '232': 'Sterling Mobile',
      '505': 'Stanbic IBTC'
    };

    return banks[bankCode] || 'Unknown Bank';
  }

  /**
   * Schedule transfer job (mock implementation)
   */
  async scheduleTransferJob(transaction, scheduleDate) {
    // In production, this would use a job queue like Bull or Agenda
    logger.info('Scheduling transfer job:', {
      transactionId: transaction._id,
      scheduleDate,
      txnRef: transaction.txnRef
    });

    // For now, we'll just update the transaction
    // A real implementation would schedule the job
    return true;
  }

  /**
   * Cancel scheduled job (mock implementation)
   */
  async cancelScheduledJob(transactionId) {
    logger.info('Cancelling scheduled job:', { transactionId });
    return true;
  }

  /**
   * Notify user of transfer initiation
   */
  async notifyTransferInitiated(user, transaction, transferResult) {
    try {
      // Create notification
      await notificationService.createNotification({
        userId: user._id,
        type: 'transfer_initiated',
        title: 'Transfer Initiated',
        message: `Your transfer of ₦${(transaction.amount / 100).toFixed(2)} has been initiated.`,
        data: {
          transactionId: transaction._id,
          txnRef: transaction.txnRef,
          amount: transaction.amount,
          beneficiary: transaction.beneficiaryAccountName,
          reference: transferResult.reference
        }
      });

      // Send email
      await emailService.sendTransferInitiated(
        user.email,
        user.firstName,
        transaction.amount / 100,
        transaction.beneficiaryAccountName,
        transaction.txnRef,
        transferResult.reference
      );

    } catch (error) {
      logger.error('Notify transfer initiated error:', error);
      // Don't throw, just log
    }
  }

  /**
   * Notify user of transfer cancellation
   */
  async notifyTransferCancelled(user, transaction, reason) {
    try {
      // Create notification
      await notificationService.createNotification({
        userId: user._id,
        type: 'transfer_cancelled',
        title: 'Transfer Cancelled',
        message: `Your transfer of ₦${(transaction.amount / 100).toFixed(2)} has been cancelled.`,
        data: {
          transactionId: transaction._id,
          txnRef: transaction.txnRef,
          amount: transaction.amount,
          reason
        }
      });

      // Send email
      await emailService.sendTransferCancelled(
        user.email,
        user.firstName,
        transaction.amount / 100,
        reason
      );

    } catch (error) {
      logger.error('Notify transfer cancelled error:', error);
      // Don't throw, just log
    }
  }

  /**
   * Get transfer statistics
   */
  async getTransferStatistics(userId = null, period = 'month') {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const query = {
        type: 'transfer',
        status: 'success',
        createdAt: { $gte: startDate }
      };

      if (userId) {
        query.userId = userId;
      }

      const stats = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalTransfers: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalFees: {
              $sum: {
                $add: [
                  { $ifNull: [{ $arrayElemAt: ['$metadata.fees.fixed', 0] }, this.fees.fixed] },
                  { $ifNull: [{ $arrayElemAt: ['$metadata.fees.percentage', 0] }, 0] }
                ]
              }
            },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      // Get transfers by status
      const statusStats = await Transaction.aggregate([
        { 
          $match: {
            type: 'transfer',
            createdAt: { $gte: startDate },
            ...(userId && { userId })
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Get recent transfers
      const recentTransfers = await Transaction.find({
        type: 'transfer',
        ...(userId && { userId })
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'firstName lastName username')
        .lean();

      return {
        period,
        startDate,
        endDate: now,
        totals: stats[0] || {
          totalTransfers: 0,
          totalAmount: 0,
          totalFees: 0,
          averageAmount: 0
        },
        byStatus: statusStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, totalAmount: stat.totalAmount };
          return acc;
        }, {}),
        recentTransfers: recentTransfers.map(transfer => 
          this.enhanceTransferData(transfer)
        )
      };

    } catch (error) {
      logger.error('Get transfer statistics error:', error);
      throw error;
    }
  }
}

export default new TransferService();