import logger from '../../config/logger.js';
import Transaction from '../../models/Transaction.js';
import VirtualAccount from '../../models/VirtualAccount.js';
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

class VirtualAccountService {
  constructor() {
    this.maxAccountsPerUser = 5; // Maximum number of active virtual accounts per user
    this.accountLifetime = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    this.cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  // ==========================================
  // ACCOUNT CREATION & MANAGEMENT
  // ==========================================

  /**
   * Create a new virtual account for a user
   */
  async createVirtualAccount(userId, accountData) {
    try {
      // Validate user exists and is active
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.accountStatus !== 'ACTIVE') {
        throw new ValidationError('User account is not active');
      }

      // Check if user has reached account limit
      const activeAccountsCount = await VirtualAccount.countDocuments({
        userId,
        isActive: true,
        status: { $in: ['pending', 'success'] }
      });

      if (activeAccountsCount >= this.maxAccountsPerUser) {
        throw new ValidationError(
          `Maximum limit of ${this.maxAccountsPerUser} active virtual accounts reached`
        );
      }

      const { 
        accountName = user.fullName, 
        bankCode = '058', // Default to GTBank
        email = user.email,
        metadata = {} 
      } = accountData;

      // Generate account details
      const accountDetails = await this.generateAccountDetails(userId, bankCode, accountName);

      // Create virtual account record
      const virtualAccount = new VirtualAccount({
        userId,
        accountNumber: accountDetails.accountNumber,
        accountName: accountDetails.accountName,
        bankName: accountDetails.bankName,
        bankCode: accountDetails.bankCode,
        zainboxCode: process.env.ZAINPAY_ZAINBOX_CODE,
        txnRef: accountDetails.txnRef,
        amount: 0, // Initially zero balance
        amountInKobo: 0,
        status: 'pending',
        expiresAt: new Date(Date.now() + this.accountLifetime),
        email,
        metadata: {
          ...metadata,
          source: 'manual_creation',
          createdBy: userId
        },
        isActive: true,
        isDynamic: false // Static account
      });

      await virtualAccount.save();

      // Log account creation
      logger.info('Virtual account created:', {
        userId,
        accountId: virtualAccount._id,
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName
      });

      // Notify user
      await this.notifyAccountCreated(user, virtualAccount);

      return {
        success: true,
        virtualAccount,
        message: 'Virtual account created successfully'
      };

    } catch (error) {
      logger.error('Create virtual account error:', error);
      throw error;
    }
  }

  /**
   * Generate dynamic virtual account for a specific payment
   */
  async createDynamicVirtualAccount(paymentData) {
    try {
      const { userId, amount, email, duration = 1800, metadata = {} } = paymentData;

      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate unique transaction reference
      const txnRef = `DVA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert amount to kobo
      const amountInKobo = Math.round(amount * 100);

      // Use Zainpay service to create dynamic virtual account
      const zainpayResult = await zainpayService.createDynamicVirtualAccount({
        userId,
        amount,
        email,
        duration,
        metadata: {
          ...metadata,
          txnRef
        }
      });

      // Create virtual account record
      const virtualAccount = new VirtualAccount({
        userId,
        accountNumber: zainpayResult.accountNumber,
        accountName: zainpayResult.accountName,
        bankName: zainpayResult.bankName,
        bankCode: '058', // GTBank code
        zainboxCode: process.env.ZAINPAY_ZAINBOX_CODE,
        txnRef,
        amount,
        amountInKobo,
        status: 'pending',
        expiresAt: new Date(Date.now() + (duration * 1000)),
        duration,
        email,
        metadata: {
          ...metadata,
          source: 'dynamic_payment',
          paymentAmount: amount
        },
        isActive: true,
        isDynamic: true
      });

      await virtualAccount.save();

      // Create transaction record
      const transaction = new Transaction({
        userId,
        txnRef,
        type: 'deposit',
        amount,
        currency: 'NGN',
        status: 'pending',
        gateway: 'zainpay',
        paymentMethod: 'virtual_account',
        description: `Virtual account payment for ₦${amount.toFixed(2)}`,
        metadata: {
          virtualAccountId: virtualAccount._id,
          ...metadata
        }
      });

      await transaction.save();

      logger.info('Dynamic virtual account created:', {
        userId,
        txnRef,
        accountNumber: virtualAccount.accountNumber,
        amount,
        expiresAt: virtualAccount.expiresAt
      });

      return {
        success: true,
        virtualAccountId: virtualAccount._id,
        transactionId: transaction._id,
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
        bankName: virtualAccount.bankName,
        txnRef,
        amount,
        expiresAt: virtualAccount.expiresAt,
        timeRemaining: virtualAccount.timeRemaining,
        instructions: `Transfer exactly ₦${amount.toFixed(2)} to the account above.`
      };

    } catch (error) {
      logger.error('Create dynamic virtual account error:', error);
      throw error;
    }
  }

  /**
   * Get all virtual accounts for a user
   */
  async getUserVirtualAccounts(userId, options = {}) {
    try {
      const { 
        status, 
        includeExpired = false,
        includeInactive = false,
        page = 1,
        limit = 20 
      } = options;

      const skip = (page - 1) * limit;

      const query = { userId };

      if (status) {
        query.status = status;
      }

      if (!includeExpired) {
        query.expiresAt = { $gt: new Date() };
      }

      if (!includeInactive) {
        query.isActive = true;
      }

      const [accounts, totalCount] = await Promise.all([
        VirtualAccount.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        VirtualAccount.countDocuments(query)
      ]);

      // Calculate current status for each account
      const now = new Date();
      const enhancedAccounts = accounts.map(account => {
        const isExpired = new Date(account.expiresAt) < now;
        return {
          ...account,
          isExpired,
          timeRemaining: isExpired ? 0 : Math.max(0, Math.floor((new Date(account.expiresAt) - now) / 1000)),
          canReceivePayments: account.isActive && account.status === 'success' && !isExpired
        };
      });

      return {
        accounts: enhancedAccounts,
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
      logger.error('Get user virtual accounts error:', error);
      throw error;
    }
  }

  /**
   * Get a specific virtual account by ID
   */
  async getVirtualAccountById(accountId, userId = null) {
    try {
      const query = { _id: accountId };
      if (userId) {
        query.userId = userId; // For user-specific lookup
      }

      const virtualAccount = await VirtualAccount.findOne(query)
        .populate('userId', 'firstName lastName username email phone');

      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      // Check if expired and update status
      const now = new Date();
      if (virtualAccount.status === 'pending' && virtualAccount.expiresAt < now) {
        virtualAccount.status = 'expired';
        await virtualAccount.save();
      }

      const isExpired = new Date(virtualAccount.expiresAt) < now;

      return {
        ...virtualAccount.toObject(),
        isExpired,
        timeRemaining: isExpired ? 0 : Math.max(0, Math.floor((new Date(virtualAccount.expiresAt) - now) / 1000)),
        canReceivePayments: virtualAccount.isActive && virtualAccount.status === 'success' && !isExpired
      };

    } catch (error) {
      logger.error('Get virtual account by ID error:', error);
      throw error;
    }
  }

  /**
   * Get virtual account by account number
   */
  async getVirtualAccountByNumber(accountNumber) {
    try {
      const virtualAccount = await VirtualAccount.findOne({ accountNumber })
        .populate('userId', 'firstName lastName username email phone');

      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      return virtualAccount;

    } catch (error) {
      logger.error('Get virtual account by number error:', error);
      throw error;
    }
  }

  /**
   * Update virtual account status
   */
  async updateAccountStatus(accountId, status, updateData = {}) {
    try {
      const virtualAccount = await VirtualAccount.findById(accountId);
      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      // Validate status transition
      this.validateStatusTransition(virtualAccount.status, status);

      const updates = {
        status,
        updatedAt: new Date()
      };

      // Add additional data based on status
      switch (status) {
        case 'success':
          updates.depositedAmount = updateData.depositedAmount || virtualAccount.amount;
          updates.senderName = updateData.senderName;
          updates.senderAccountNumber = updateData.senderAccountNumber;
          updates.completedAt = new Date();
          break;

        case 'mismatch':
          updates.depositedAmount = updateData.depositedAmount || 0;
          updates.senderName = updateData.senderName;
          updates.senderAccountNumber = updateData.senderAccountNumber;
          updates.failureReason = 'Amount mismatch';
          break;

        case 'expired':
          updates.isActive = false;
          updates.failureReason = 'Account expired';
          break;

        case 'failed':
          updates.failureReason = updateData.failureReason || 'Payment failed';
          updates.isActive = false;
          break;
      }

      // Update account
      const updatedAccount = await VirtualAccount.findByIdAndUpdate(
        accountId,
        updates,
        { new: true }
      );

      // If payment was successful, update related transaction
      if (status === 'success' && virtualAccount.txnRef) {
        await Transaction.findOneAndUpdate(
          { txnRef: virtualAccount.txnRef },
          {
            status: 'success',
            completedAt: new Date(),
            gatewayRef: updateData.paymentRef,
            metadata: {
              ...updateData,
              virtualAccountId: accountId
            }
          }
        );

        // Notify user of successful payment
        await this.notifyPaymentSuccess(updatedAccount, updateData);
      }

      logger.info('Virtual account status updated:', {
        accountId,
        oldStatus: virtualAccount.status,
        newStatus: status
      });

      return updatedAccount;

    } catch (error) {
      logger.error('Update account status error:', error);
      throw error;
    }
  }

  /**
   * Deactivate a virtual account
   */
  async deactivateAccount(accountId, reason = 'User request') {
    try {
      const virtualAccount = await VirtualAccount.findById(accountId);
      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      virtualAccount.isActive = false;
      virtualAccount.deactivatedAt = new Date();
      virtualAccount.deactivationReason = reason;
      await virtualAccount.save();

      logger.info('Virtual account deactivated:', {
        accountId,
        accountNumber: virtualAccount.accountNumber,
        reason
      });

      return {
        success: true,
        message: 'Virtual account deactivated successfully'
      };

    } catch (error) {
      logger.error('Deactivate account error:', error);
      throw error;
    }
  }

  /**
   * Reactivate a virtual account
   */
  async reactivateAccount(accountId) {
    try {
      const virtualAccount = await VirtualAccount.findById(accountId);
      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      // Check if account can be reactivated
      if (virtualAccount.status === 'expired') {
        throw new ValidationError('Expired accounts cannot be reactivated');
      }

      virtualAccount.isActive = true;
      virtualAccount.reactivatedAt = new Date();
      await virtualAccount.save();

      logger.info('Virtual account reactivated:', {
        accountId,
        accountNumber: virtualAccount.accountNumber
      });

      return {
        success: true,
        message: 'Virtual account reactivated successfully'
      };

    } catch (error) {
      logger.error('Reactivate account error:', error);
      throw error;
    }
  }

  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================

  /**
   * Process incoming payment to virtual account
   */
  async processIncomingPayment(accountNumber, paymentData) {
    try {
      const { amount, senderName, senderAccountNumber, bankName, reference } = paymentData;

      // Find virtual account
      const virtualAccount = await this.getVirtualAccountByNumber(accountNumber);

      // Check if account is active and can receive payments
      if (!virtualAccount.isActive) {
        throw new PaymentError('Virtual account is not active');
      }

      if (virtualAccount.status === 'expired') {
        throw new PaymentError('Virtual account has expired');
      }

      // For dynamic accounts, check if amount matches
      if (virtualAccount.isDynamic) {
        const expectedAmount = virtualAccount.amount;
        const tolerance = 100; // 1 Naira tolerance in kobo
        
        if (Math.abs(amount - expectedAmount) > tolerance) {
          // Amount mismatch
          await this.updateAccountStatus(virtualAccount._id, 'mismatch', {
            depositedAmount: amount,
            senderName,
            senderAccountNumber,
            bankName,
            reference
          });

          throw new PaymentError(
            `Amount mismatch. Expected: ₦${(expectedAmount / 100).toFixed(2)}, Received: ₦${(amount / 100).toFixed(2)}`
          );
        }
      }

      // Update account with payment details
      const updatedAccount = await this.updateAccountStatus(virtualAccount._id, 'success', {
        depositedAmount: amount,
        senderName,
        senderAccountNumber,
        bankName,
        reference,
        paymentRef: reference
      });

      // For dynamic accounts, complete the associated transaction
      if (virtualAccount.isDynamic && virtualAccount.txnRef) {
        await this.completeDynamicPayment(virtualAccount, paymentData);
      }

      // Log successful payment
      logger.info('Payment processed to virtual account:', {
        accountId: virtualAccount._id,
        accountNumber,
        amount,
        senderName,
        reference
      });

      return {
        success: true,
        virtualAccount: updatedAccount,
        message: 'Payment processed successfully'
      };

    } catch (error) {
      logger.error('Process incoming payment error:', error);
      throw error;
    }
  }

  /**
   * Check virtual account payment status
   */
  async checkPaymentStatus(accountId) {
    try {
      const virtualAccount = await VirtualAccount.findById(accountId);
      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      // For dynamic accounts, check with payment gateway
      if (virtualAccount.isDynamic && virtualAccount.txnRef) {
        const status = await zainpayService.checkDynamicVirtualAccountStatus(
          virtualAccount.txnRef,
          virtualAccount.userId
        );

        // Update local status if different
        if (status.status !== virtualAccount.status) {
          await this.updateAccountStatus(accountId, status.status, {
            depositedAmount: status.depositedAmount,
            senderName: status.senderName,
            bankName: status.bankName
          });
        }

        return {
          accountId,
          txnRef: virtualAccount.txnRef,
          status: status.status,
          isSuccessful: status.isSuccessful,
          amount: status.amount,
          depositedAmount: status.depositedAmount,
          senderName: status.senderName,
          bankName: status.bankName,
          lastChecked: new Date()
        };
      }

      // For static accounts, return current status
      const now = new Date();
      const isExpired = virtualAccount.expiresAt < now;

      return {
        accountId,
        accountNumber: virtualAccount.accountNumber,
        status: isExpired && virtualAccount.status === 'pending' ? 'expired' : virtualAccount.status,
        amount: virtualAccount.amount,
        depositedAmount: virtualAccount.depositedAmount,
        senderName: virtualAccount.senderName,
        isExpired,
        expiresAt: virtualAccount.expiresAt,
        timeRemaining: isExpired ? 0 : Math.max(0, Math.floor((virtualAccount.expiresAt - now) / 1000)),
        lastChecked: new Date()
      };

    } catch (error) {
      logger.error('Check payment status error:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a virtual account
   */
  async getAccountPaymentHistory(accountId, filters = {}) {
    try {
      const virtualAccount = await VirtualAccount.findById(accountId);
      if (!virtualAccount) {
        throw new NotFoundError('Virtual account not found');
      }

      const query = { 'metadata.virtualAccountId': accountId };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 20)
        .populate('userId', 'firstName lastName username email');

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        total,
        page: Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1,
        pages: Math.ceil(total / (filters.limit || 20))
      };

    } catch (error) {
      logger.error('Get account payment history error:', error);
      throw error;
    }
  }

  // ==========================================
  // BATCH OPERATIONS & CLEANUP
  // ==========================================

  /**
   * Clean up expired virtual accounts
   */
  async cleanupExpiredAccounts() {
    try {
      const expiredCutoff = new Date();
      
      // Find accounts that expired more than 24 hours ago
      const expiredAccounts = await VirtualAccount.find({
        status: 'pending',
        expiresAt: { $lt: expiredCutoff }
      });

      let updatedCount = 0;
      
      for (const account of expiredAccounts) {
        try {
          account.status = 'expired';
          account.isActive = false;
          await account.save();
          updatedCount++;
        } catch (error) {
          logger.error(`Failed to update expired account ${account._id}:`, error);
        }
      }

      // Also deactivate accounts that have been inactive for 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const oldInactiveAccounts = await VirtualAccount.find({
        isActive: true,
        status: 'success',
        updatedAt: { $lt: ninetyDaysAgo }
      });

      for (const account of oldInactiveAccounts) {
        try {
          account.isActive = false;
          account.deactivationReason = 'Inactive for 90 days';
          await account.save();
          updatedCount++;
        } catch (error) {
          logger.error(`Failed to deactivate old account ${account._id}:`, error);
        }
      }

      logger.info('Expired accounts cleanup completed:', {
        updatedCount,
        totalProcessed: expiredAccounts.length + oldInactiveAccounts.length
      });

      return updatedCount;

    } catch (error) {
      logger.error('Cleanup expired accounts error:', error);
      throw error;
    }
  }

  /**
   * Bulk update virtual account statuses
   */
  async bulkUpdateStatus(accountIds, status, reason = '') {
    try {
      const results = {
        successful: [],
        failed: []
      };

      for (const accountId of accountIds) {
        try {
          const account = await VirtualAccount.findById(accountId);
          if (!account) {
            results.failed.push({
              accountId,
              error: 'Account not found'
            });
            continue;
          }

          account.status = status;
          if (reason) {
            account.metadata.bulkUpdateReason = reason;
          }
          await account.save();

          results.successful.push({
            accountId,
            status,
            updatedAt: new Date()
          });

        } catch (error) {
          results.failed.push({
            accountId,
            error: error.message
          });
        }
      }

      logger.info('Bulk status update completed:', {
        total: accountIds.length,
        successful: results.successful.length,
        failed: results.failed.length
      });

      return results;

    } catch (error) {
      logger.error('Bulk update status error:', error);
      throw error;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Generate unique account details
   */
  async generateAccountDetails(userId, bankCode, accountName) {
    try {
      // In a real implementation, this would call a bank API or use a virtual account provider
      // For now, we'll generate a mock account number
      const accountNumber = this.generateMockAccountNumber();
      
      // Get bank name from bank code
      const bankName = this.getBankName(bankCode);
      
      // Generate transaction reference
      const txnRef = `VA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        accountNumber,
        accountName: accountName.substring(0, 100), // Truncate if too long
        bankName,
        bankCode,
        txnRef
      };

    } catch (error) {
      logger.error('Generate account details error:', error);
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ['success', 'failed', 'expired', 'mismatch'],
      success: ['refunded', 'cancelled'],
      failed: [], // Cannot transition from failed
      expired: [], // Cannot transition from expired
      mismatch: ['success', 'failed'],
      refunded: [], // Cannot transition from refunded
      cancelled: [] // Cannot transition from cancelled
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Complete dynamic payment
   */
  async completeDynamicPayment(virtualAccount, paymentData) {
    try {
      // Find and update the associated transaction
      const transaction = await Transaction.findOne({ txnRef: virtualAccount.txnRef });
      if (transaction) {
        transaction.status = 'success';
        transaction.completedAt = new Date();
        transaction.gatewayRef = paymentData.reference;
        transaction.metadata = {
          ...transaction.metadata,
          ...paymentData,
          virtualAccountId: virtualAccount._id
        };
        await transaction.save();

        // Create payment record if it doesn't exist
        const Payment = (await import('../../models/Payment.js')).default;
        await Payment.findOneAndUpdate(
          { transactionId: transaction._id },
          {
            userId: virtualAccount.userId,
            transactionId: transaction._id,
            virtualAccountId: virtualAccount._id,
            amount: paymentData.amount / 100, // Convert from kobo to Naira
            status: 'completed',
            gateway: 'zainpay',
            paymentMethod: 'virtual_account',
            gatewayRef: paymentData.reference,
            metadata: {
              ...paymentData,
              virtualAccountId: virtualAccount._id
            }
          },
          { upsert: true, new: true }
        );
      }

    } catch (error) {
      logger.error('Complete dynamic payment error:', error);
      throw error;
    }
  }

  /**
   * Notify user when account is created
   */
  async notifyAccountCreated(user, virtualAccount) {
    try {
      // Create notification
      await notificationService.createNotification({
        userId: user._id,
        type: 'virtual_account_created',
        title: 'Virtual Account Created',
        message: `Your virtual account ${virtualAccount.accountNumber} has been created successfully.`,
        data: {
          accountId: virtualAccount._id,
          accountNumber: virtualAccount.accountNumber,
          bankName: virtualAccount.bankName
        }
      });

      // Send email
      await emailService.sendVirtualAccountCreated(
        user.email,
        user.firstName,
        virtualAccount
      );

    } catch (error) {
      logger.error('Notify account created error:', error);
      // Don't throw, just log
    }
  }

  /**
   * Notify user of successful payment
   */
  async notifyPaymentSuccess(virtualAccount, paymentData) {
    try {
      const user = await User.findById(virtualAccount.userId);
      if (!user) return;

      // Create notification
      await notificationService.createNotification({
        userId: user._id,
        type: 'payment_received',
        title: 'Payment Received',
        message: `₦${(paymentData.depositedAmount / 100).toFixed(2)} has been deposited to your virtual account.`,
        data: {
          accountId: virtualAccount._id,
          accountNumber: virtualAccount.accountNumber,
          amount: paymentData.depositedAmount,
          senderName: paymentData.senderName,
          reference: paymentData.reference
        }
      });

      // Send email
      await emailService.sendPaymentReceived(
        user.email,
        user.firstName,
        paymentData.depositedAmount / 100, // Convert to Naira
        virtualAccount.accountNumber,
        paymentData.senderName,
        paymentData.reference
      );

    } catch (error) {
      logger.error('Notify payment success error:', error);
      // Don't throw, just log
    }
  }

  /**
   * Generate mock account number (for development)
   */
  generateMockAccountNumber() {
    // Generate 10-digit account number
    return Array.from({ length: 10 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
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
   * Get account statistics
   */
  async getAccountStatistics(userId = null) {
    try {
      const query = userId ? { userId } : {};
      
      const stats = await VirtualAccount.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalStats = await VirtualAccount.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAccounts: { $sum: 1 },
            activeAccounts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            dynamicAccounts: {
              $sum: { $cond: [{ $eq: ['$isDynamic', true] }, 1, 0] }
            },
            totalDeposited: { $sum: '$depositedAmount' }
          }
        }
      ]);

      // Get recent activity
      const recentActivity = await VirtualAccount.find(query)
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('userId', 'firstName lastName username')
        .lean();

      return {
        statusBreakdown: stats.reduce((acc, curr) => {
          acc[curr._id] = { count: curr.count, totalAmount: curr.totalAmount };
          return acc;
        }, {}),
        totals: totalStats[0] || {
          totalAccounts: 0,
          activeAccounts: 0,
          dynamicAccounts: 0,
          totalDeposited: 0
        },
        recentActivity
      };

    } catch (error) {
      logger.error('Get account statistics error:', error);
      throw error;
    }
  }
}

export default new VirtualAccountService();