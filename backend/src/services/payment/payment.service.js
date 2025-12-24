import logger from '../../config/logger.js';
import zainpayService from './zainpay.service.js';
import Transaction from '../../models/Transaction.js';
import Payment from '../../models/Payment.js';
import VirtualAccount from '../../models/VirtualAccount.js';
import User from '../../models/User.js';
import Solution from '../../models/Solution.js';
import Job from '../../models/Job.js';
import Subscription from '../../models/Subscription.js';
import MarketplaceListing from '../../models/MarketplaceListing.js';
import crypto from 'crypto';
import { 
  AppError, 
  PaymentError, 
  ValidationError, 
  NotFoundError 
} from '../../errors/index.js';
import { getRedisClient } from '../../config/redis.js';
import emailService from '../notification/email.service.js';
import notificationService from '../notification/notification.service.js';
import subscriptionService from '../subscription/subscription.service.js';
import jobService from '../job/job.service.js';
import marketplaceService from '../marketplace/marketplace.service.js';

class PaymentService {
  constructor() {
    this.gateways = {
      'zainpay': zainpayService
    };
    this.redis = getRedisClient();
    this.emailService = emailService;
    this.notificationService = notificationService;
    
    // Initialize payment types and pricing
    this.initPricing();
  }

  initPricing() {
    // Load pricing from environment variables
    this.pricing = {
      solutionPremiumUpgrade: parseInt(process.env.SOLUTION_PREMIUM_UPGRADE_PRICE) || 15000,
      
      jobPosting: {
        FREE_TIER: parseInt(process.env.JOB_POSTING_PRICE_FREE) || 50000,
        BASE_TIER: parseInt(process.env.JOB_POSTING_PRICE_BASE) || 40000,
        MID_TIER: parseInt(process.env.JOB_POSTING_PRICE_MID) || 30000,
        TOP_TIER: parseInt(process.env.JOB_POSTING_PRICE_TOP) || 20000
      },
      
      marketplaceSlot: {
        FREE_TIER: parseInt(process.env.SLOT_PRICE_FREE) || 30000,
        BASE_TIER: parseInt(process.env.SLOT_PRICE_BASE) || 25000,
        MID_TIER: parseInt(process.env.SLOT_PRICE_MID) || 20000,
        TOP_TIER: parseInt(process.env.SLOT_PRICE_TOP) || 15000
      },
      
      subscriptions: {
        BASE_YEARLY: parseInt(process.env.SUBSCRIPTION_BASE_YEARLY) || 1000000,
        BASE_LIFETIME: parseInt(process.env.SUBSCRIPTION_BASE_LIFETIME) || 5000000,
        MID_YEARLY: parseInt(process.env.SUBSCRIPTION_MID_YEARLY) || 2500000,
        TOP_HALF_YEARLY: parseInt(process.env.SUBSCRIPTION_TOP_HALF_YEARLY) || 2000000,
        TOP_YEARLY: parseInt(process.env.SUBSCRIPTION_TOP_YEARLY) || 3500000
      }
    };
  }

  // ==========================================
  // CORE PAYMENT PROCESSING
  // ==========================================

  async createPayment(paymentData) {
    try {
      const { userId, amount, gateway = 'zainpay', paymentMethod, metadata = {} } = paymentData;
      
      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get gateway service
      const gatewayService = this.gateways[gateway];
      if (!gatewayService) {
        throw new ValidationError(`Unsupported gateway: ${gateway}`);
      }

      let result;
      
      // Route to appropriate method based on payment method
      switch (paymentMethod) {
        case 'virtual_account':
          result = await gatewayService.createDynamicVirtualAccount({
            userId,
            amount,
            email: user.email,
            metadata
          });
          break;
          
        case 'card':
          result = await gatewayService.initializeCardPayment({
            userId,
            amount,
            email: user.email,
            phone: user.phone,
            metadata
          });
          break;
          
        case 'bank_transfer':
          result = await gatewayService.transferToBank({
            userId,
            ...paymentData
          });
          break;
          
        default:
          throw new ValidationError(`Unsupported payment method: ${paymentMethod}`);
      }

      logger.info('Payment created successfully:', {
        userId,
        gateway,
        paymentMethod,
        amount,
        transactionId: result.transactionId
      });

      return result;
      
    } catch (error) {
      logger.error('Create payment error:', error);
      throw error;
    }
  }

  async verifyPayment(txnRef, gateway = 'zainpay') {
    try {
      const gatewayService = this.gateways[gateway];
      if (!gatewayService) {
        throw new ValidationError(`Unsupported gateway: ${gateway}`);
      }

      // Get transaction to determine payment method
      const transaction = await Transaction.findOne({ txnRef });
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      let result;
      
      if (transaction.paymentMethod === 'virtual_account') {
        result = await gatewayService.checkDynamicVirtualAccountStatus(txnRef, transaction.userId);
      } else if (transaction.paymentMethod === 'card') {
        result = await gatewayService.verifyCardPayment(txnRef, transaction.userId);
      } else if (transaction.paymentMethod === 'transfer') {
        result = await gatewayService.verifyTransfer(txnRef, transaction.userId);
      } else {
        throw new ValidationError(`Cannot verify payment method: ${transaction.paymentMethod}`);
      }

      return result;
      
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  }

  // ==========================================
  // SPECIFIC PAYMENT FLOWS (Stackkin-Specific)
  // ==========================================

  async processPremiumUpgrade(solutionId, userId, paymentMethod = 'zainpay') {
    try {
      // Get solution
      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check if already premium
      if (solution.isPremium) {
        throw new ValidationError('Solution is already premium');
      }

      // Check if user owns the solution
      if (solution.user.toString() !== userId.toString()) {
        throw new ValidationError('You do not own this solution');
      }

      // Get user subscription tier
      const subscription = await subscriptionService.getUserActiveSubscription(userId);
      const userTier = subscription?.tier || 'FREE_TIER';

      // Check if user can upgrade based on subscription tier
      if (userTier !== 'MID_TIER' && userTier !== 'TOP_TIER') {
        throw new ValidationError('Premium upgrades only available for Mid and Top tier subscribers');
      }

      // Get premium upgrade price
      const amount = this.pricing.solutionPremiumUpgrade; // in kobo
      const amountInNaira = amount / 100;

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'solution_premium_upgrade',
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        paymentMethod,
        gateway: 'zainpay',
        metadata: {
          solutionId,
          solutionTitle: solution.title,
          action: 'PREMIUM_UPGRADE'
        }
      });

      await transaction.save();

      let paymentResult;
      
      // Process payment based on method
      if (paymentMethod === 'zainpay') {
        // Use Zainpay dynamic virtual account
        paymentResult = await this.gateways.zainpay.createDynamicVirtualAccount({
          userId,
          amount: amountInNaira,
          email: user.email,
          duration: 1800, // 30 minutes
          metadata: {
            transactionId: transaction._id,
            solutionId,
            userId,
            type: 'premium_upgrade'
          }
        });

        // Update transaction with payment reference
        transaction.txnRef = paymentResult.txnRef;
        transaction.metadata.zainpayData = {
          accountNumber: paymentResult.accountNumber,
          bankName: paymentResult.bankName,
          expiresAt: paymentResult.expiresAt
        };
        
        await transaction.save();

        // Return DVA details for user to pay
        return {
          success: true,
          requiresPayment: true,
          paymentMethod: 'bank_transfer',
          transactionId: transaction._id,
          paymentReference: paymentResult.txnRef,
          accountDetails: {
            accountNumber: paymentResult.accountNumber,
            accountName: paymentResult.accountName,
            bankName: paymentResult.bankName,
            amount: paymentResult.amount,
            expiresAt: paymentResult.expiresAt,
            instructions: paymentResult.instructions
          },
          message: 'Please transfer the exact amount to the account above to complete your premium upgrade'
        };

      } else if (paymentMethod === 'card') {
        // Use Zainpay card payment
        const user = await User.findById(userId);
        paymentResult = await this.gateways.zainpay.initializeCardPayment({
          userId,
          amount: amountInNaira,
          email: user.email,
          phone: user.phone,
          metadata: {
            transactionId: transaction._id,
            solutionId,
            userId,
            type: 'premium_upgrade'
          }
        });

        // Update transaction
        transaction.txnRef = paymentResult.txnRef;
        await transaction.save();

        return {
          success: true,
          requiresPayment: true,
          paymentMethod: 'card',
          transactionId: transaction._id,
          paymentReference: paymentResult.txnRef,
          redirectUrl: paymentResult.redirectUrl,
          message: 'Redirect to payment page to complete your premium upgrade'
        };

      } else {
        throw new ValidationError('Unsupported payment method');
      }

    } catch (error) {
      logger.error('Process premium upgrade payment error:', error);
      throw error;
    }
  }

  async processJobPostingPayment(userId, jobData, paymentMethod = 'zainpay') {
    try {
      // Get user subscription tier
      const subscription = await subscriptionService.getUserActiveSubscription(userId);
      const userTier = subscription?.tier || 'FREE_TIER';
      
      // Get job posting price based on subscription tier
      const amount = this.pricing.jobPosting[userTier]; // in kobo
      const amountInNaira = amount / 100;
      
      // Check user's free job posting allowance
      const user = await User.findById(userId);
      const freeJobAllowance = this.getFreeJobPostingAllowance(userTier, user);
      
      if (freeJobAllowance.available > 0) {
        // Use free job posting
        return {
          success: true,
          requiresPayment: false,
          freeAllowanceUsed: true,
          remainingFreePostings: freeJobAllowance.available - 1,
          message: 'Free job posting allowance used successfully'
        };
      }

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'job_posting',
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        paymentMethod,
        gateway: 'zainpay',
        metadata: {
          jobTitle: jobData.title,
          jobType: jobData.type,
          tier: userTier,
          action: 'JOB_POSTING'
        }
      });

      await transaction.save();

      // Process payment
      const paymentResult = await this.processPaymentBasedOnMethod({
        userId,
        amount: amountInNaira,
        paymentMethod,
        transactionId: transaction._id,
        metadata: {
          type: 'job_posting',
          jobData
        }
      });

      // Update transaction
      transaction.txnRef = paymentResult.txnRef || paymentResult.paymentReference;
      await transaction.save();

      return {
        success: true,
        requiresPayment: true,
        transactionId: transaction._id,
        ...paymentResult
      };
      
    } catch (error) {
      logger.error('Process job posting payment error:', error);
      throw error;
    }
  }

  async processMarketplaceSlotPayment(userId, listingData, paymentMethod = 'zainpay') {
    try {
      // Get user subscription tier
      const subscription = await subscriptionService.getUserActiveSubscription(userId);
      const userTier = subscription?.tier || 'FREE_TIER';
      
      // Get marketplace slot price based on subscription tier
      const amount = this.pricing.marketplaceSlot[userTier]; // in kobo
      const amountInNaira = amount / 100;
      
      // Check user's free slot allowance
      const user = await User.findById(userId);
      const freeSlotAllowance = this.getFreeSlotAllowance(userTier, user);
      
      if (freeSlotAllowance.available > 0) {
        // Use free slot
        return {
          success: true,
          requiresPayment: false,
          freeAllowanceUsed: true,
          remainingFreeSlots: freeSlotAllowance.available - 1,
          message: 'Free marketplace slot allowance used successfully'
        };
      }

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'marketplace_slot',
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        paymentMethod,
        gateway: 'zainpay',
        metadata: {
          listingTitle: listingData.title,
          listingType: listingData.type,
          tier: userTier,
          action: 'MARKETPLACE_SLOT'
        }
      });

      await transaction.save();

      // Process payment
      const paymentResult = await this.processPaymentBasedOnMethod({
        userId,
        amount: amountInNaira,
        paymentMethod,
        transactionId: transaction._id,
        metadata: {
          type: 'marketplace_slot',
          listingData
        }
      });

      // Update transaction
      transaction.txnRef = paymentResult.txnRef || paymentResult.paymentReference;
      await transaction.save();

      return {
        success: true,
        requiresPayment: true,
        transactionId: transaction._id,
        ...paymentResult
      };
      
    } catch (error) {
      logger.error('Process marketplace slot payment error:', error);
      throw error;
    }
  }

  async processSubscriptionPayment(userId, subscriptionTier, billingPeriod, paymentMethod = 'zainpay') {
    try {
      // Get subscription price
      const priceKey = `${subscriptionTier}_${billingPeriod.toUpperCase()}`;
      const amount = this.pricing.subscriptions[priceKey]; // in kobo
      
      if (!amount) {
        throw new ValidationError('Invalid subscription tier or billing period');
      }
      
      const amountInNaira = amount / 100;

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'subscription',
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        paymentMethod,
        gateway: 'zainpay',
        metadata: {
          subscriptionTier,
          billingPeriod,
          action: 'SUBSCRIPTION_PAYMENT'
        }
      });

      await transaction.save();

      // Process payment
      const user = await User.findById(userId);
      const paymentResult = await this.processPaymentBasedOnMethod({
        userId,
        amount: amountInNaira,
        paymentMethod,
        transactionId: transaction._id,
        metadata: {
          type: 'subscription',
          subscriptionTier,
          billingPeriod,
          email: user.email
        }
      });

      // Update transaction
      transaction.txnRef = paymentResult.txnRef || paymentResult.paymentReference;
      await transaction.save();

      return {
        success: true,
        requiresPayment: true,
        transactionId: transaction._id,
        ...paymentResult
      };
      
    } catch (error) {
      logger.error('Process subscription payment error:', error);
      throw error;
    }
  }

  // ==========================================
  // PAYMENT COMPLETION & WEBHOOK HANDLING
  // ==========================================

  async completePremiumUpgrade(transactionId) {
    try {
      // Get transaction
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new ValidationError(`Transaction already ${transaction.status}`);
      }

      const { solutionId, paymentMethod } = transaction.metadata;
      
      let paymentStatus;
      
      // Verify payment based on method
      if (paymentMethod === 'zainpay') {
        paymentStatus = await this.gateways.zainpay.checkDynamicVirtualAccountStatus(
          transaction.txnRef
        );
      } else if (paymentMethod === 'card') {
        paymentStatus = await this.gateways.zainpay.verifyCardPayment(
          transaction.txnRef
        );
      } else {
        throw new ValidationError('Unsupported payment method');
      }

      // Update transaction status
      if (paymentStatus.isSuccessful) {
        transaction.status = 'success';
        transaction.completedAt = new Date();
        transaction.metadata.paymentVerification = paymentStatus;
        
        await transaction.save();

        // Upgrade solution to premium
        const solution = await Solution.findById(solutionId);
        solution.isPremium = true;
        solution.premiumUpgradedAt = new Date();
        await solution.save();

        // Create payment record
        await Payment.create({
          userId: transaction.userId,
          transactionId: transaction._id,
          amount: transaction.amount,
          status: 'completed',
          gateway: transaction.gateway,
          paymentMethod: transaction.paymentMethod,
          gatewayRef: transaction.txnRef,
          metadata: transaction.metadata
        });

        // Notify user
        await this.sendPremiumUpgradeConfirmation(transaction);

        logger.info(`Premium upgrade completed: transaction ${transactionId}, solution ${solutionId}`);
        
        return {
          success: true,
          transaction,
          solution,
          message: 'Premium upgrade completed successfully'
        };

      } else {
        transaction.status = 'failed';
        transaction.metadata.paymentVerification = paymentStatus;
        await transaction.save();

        throw new PaymentError(`Payment ${paymentStatus.status}: ${paymentStatus.message || 'Payment verification failed'}`);
      }

    } catch (error) {
      logger.error('Complete premium upgrade error:', error);
      throw error;
    }
  }

  async handleZainpayWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const isValid = this.gateways.zainpay.verifyWebhookSignature(payload, signature);
      
      if (!isValid) {
        throw new PaymentError('Invalid webhook signature');
      }

      const { event, data } = payload;
      
      // Process based on event type
      switch (event) {
        case 'deposit.success':
          await this.handleDepositWebhook(data);
          break;
          
        case 'transfer.success':
          await this.handleTransferWebhook(data);
          break;
          
        case 'transfer.failed':
          await this.handleTransferFailedWebhook(data);
          break;
          
        default:
          logger.warn(`Unhandled webhook event: ${event}`);
      }

      // Also let Zainpay service process it
      await this.gateways.zainpay.processWebhookEvent(event, data);

      return { processed: true, event };

    } catch (error) {
      logger.error('Handle Zainpay webhook error:', error);
      throw error;
    }
  }

  async handleDepositWebhook(data) {
    try {
      const { txnRef, depositedAmount, paymentRef, cardToken } = data;
      
      // Find transaction by reference
      const transaction = await Transaction.findOne({
        txnRef: txnRef,
        status: 'pending'
      });
      
      if (!transaction) {
        logger.warn('Transaction not found for webhook:', { txnRef });
        return;
      }

      // Update transaction
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.metadata.webhookData = data;
      
      await transaction.save();

      // Complete the associated action based on transaction type
      switch (transaction.type) {
        case 'solution_premium_upgrade':
          await this.completePremiumUpgradeFromWebhook(transaction);
          break;
          
        case 'job_posting':
          await this.completeJobPostingFromWebhook(transaction);
          break;
          
        case 'marketplace_slot':
          await this.completeMarketplaceSlotFromWebhook(transaction);
          break;
          
        case 'subscription':
          await this.completeSubscriptionFromWebhook(transaction);
          break;
          
        default:
          logger.warn(`Unhandled transaction type in webhook: ${transaction.type}`);
      }

      logger.info('Deposit webhook processed successfully:', { txnRef, transactionId: transaction._id });

    } catch (error) {
      logger.error('Handle deposit webhook error:', error);
      throw error;
    }
  }

  async completePremiumUpgradeFromWebhook(transaction) {
    try {
      const { solutionId } = transaction.metadata;
      
      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Upgrade solution
      solution.isPremium = true;
      solution.premiumUpgradedAt = new Date();
      await solution.save();

      // Create payment record
      await Payment.create({
        userId: transaction.userId,
        transactionId: transaction._id,
        amount: transaction.amount,
        status: 'completed',
        gateway: transaction.gateway,
        paymentMethod: transaction.paymentMethod,
        gatewayRef: transaction.txnRef,
        metadata: transaction.metadata
      });

      // Send confirmation email
      const user = await User.findById(transaction.userId);
      if (user) {
        await this.emailService.sendPremiumUpgradeConfirmation(
          user.email,
          user.firstName,
          solution,
          transaction
        );
      }

      logger.info(`Premium upgrade completed via webhook: solution ${solutionId}, transaction ${transaction._id}`);

    } catch (error) {
      logger.error('Complete premium upgrade from webhook error:', error);
      throw error;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  async processPaymentBasedOnMethod(paymentData) {
    const { userId, amount, paymentMethod, transactionId, metadata } = paymentData;
    const user = await User.findById(userId);

    switch (paymentMethod) {
      case 'virtual_account':
        return await this.gateways.zainpay.createDynamicVirtualAccount({
          userId,
          amount,
          email: user.email,
          duration: 1800,
          metadata: {
            transactionId,
            ...metadata
          }
        });
        
      case 'card':
        return await this.gateways.zainpay.initializeCardPayment({
          userId,
          amount,
          email: user.email,
          phone: user.phone,
          metadata: {
            transactionId,
            ...metadata
          }
        });
        
      default:
        throw new ValidationError(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  getFreeJobPostingAllowance(tier, user) {
    const allowances = {
      'FREE_TIER': { total: 1, used: user.metadata?.freeJobPostingsUsed || 0 },
      'BASE_TIER': { total: 2, used: user.metadata?.freeJobPostingsUsed || 0 },
      'MID_TIER': { total: 3, used: user.metadata?.freeJobPostingsUsed || 0 },
      'TOP_TIER': { total: 4, used: user.metadata?.freeJobPostingsUsed || 0 }
    };
    
    const allowance = allowances[tier] || allowances.FREE_TIER;
    return {
      total: allowance.total,
      used: allowance.used,
      available: Math.max(0, allowance.total - allowance.used)
    };
  }

  getFreeSlotAllowance(tier, user) {
    const allowances = {
      'FREE_TIER': { total: 1, used: user.metadata?.freeSlotsUsed || 0 },
      'BASE_TIER': { total: 2, used: user.metadata?.freeSlotsUsed || 0 },
      'MID_TIER': { total: 3, used: user.metadata?.freeSlotsUsed || 0 },
      'TOP_TIER': { total: 5, used: user.metadata?.freeSlotsUsed || 0 }
    };
    
    const allowance = allowances[tier] || allowances.FREE_TIER;
    return {
      total: allowance.total,
      used: allowance.used,
      available: Math.max(0, allowance.total - allowance.used)
    };
  }

  async sendPremiumUpgradeConfirmation(transaction) {
    try {
      const user = await User.findById(transaction.userId);
      const solution = await Solution.findById(transaction.metadata.solutionId);
      
      if (!user || !solution) {
        return;
      }

      await this.emailService.sendPremiumUpgradeConfirmation(
        user.email,
        user.firstName,
        solution,
        transaction
      );

      await this.notificationService.createNotification({
        userId: user._id,
        type: 'payment_success',
        title: 'Premium Upgrade Successful',
        message: `Your solution "${solution.title}" has been upgraded to premium!`,
        data: {
          solutionId: solution._id,
          transactionId: transaction._id,
          amount: transaction.amount
        }
      });

      logger.info(`Premium upgrade confirmation sent to ${user.email}, solution: ${solution._id}`);

    } catch (error) {
      logger.error('Send premium upgrade confirmation error:', error);
      // Don't throw, just log
    }
  }

  // ==========================================
  // USER PAYMENT MANAGEMENT
  // ==========================================

  async getTransactionHistory(userId, filters = {}) {
    try {
      const query = { userId };
      
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 50)
        .populate('userId', 'firstName lastName username email');

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        total,
        page: Math.floor((filters.skip || 0) / (filters.limit || 50)) + 1,
        pages: Math.ceil(total / (filters.limit || 50))
      };
      
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw error;
    }
  }

  async getUserVirtualAccounts(userId) {
    try {
      const virtualAccounts = await VirtualAccount.find({ userId })
        .sort({ createdAt: -1 });

      // Check expiration status for pending accounts
      const now = new Date();
      for (const account of virtualAccounts) {
        if (account.status === 'pending' && account.expiresAt < now) {
          account.status = 'expired';
          await account.save();
        }
      }

      return virtualAccounts;
      
    } catch (error) {
      logger.error('Get user virtual accounts error:', error);
      throw error;
    }
  }

  // Renamed from getPaymentStatistics to getUserPaymentStatistics
  async getUserPaymentStatistics(userId) {
    try {
      const stats = await Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalStats = await Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0]
              }
            }
          }
        }
      ]);

      return {
        statusBreakdown: stats.reduce((acc, curr) => {
          acc[curr._id] = { count: curr.count, totalAmount: curr.totalAmount };
          return acc;
        }, {}),
        totals: totalStats[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          successfulAmount: 0
        }
      };
      
    } catch (error) {
      logger.error('Get user payment statistics error:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('userId', 'firstName lastName username email')
        .populate('metadata.solutionId', 'title slug');
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      
      return transaction;
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      throw error;
    }
  }

  async getUserTransactions(userId, filter = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const query = { userId };
      
      if (filter.type) {
        query.type = filter.type;
      }
      
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.startDate) {
        query.createdAt = { $gte: new Date(filter.startDate) };
      }
      
      if (filter.endDate) {
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$lte = new Date(filter.endDate);
      }

      const [transactions, totalCount] = await Promise.all([
        Transaction.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('metadata.solutionId', 'title slug')
          .exec(),
        Transaction.countDocuments(query)
      ]);

      return {
        transactions,
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
      logger.error('Get user transactions error:', error);
      throw error;
    }
  }

  // ==========================================
  // PRICE CALCULATION METHODS
  // ==========================================

  calculateJobPostingPrice(subscriptionTier) {
    return this.pricing.jobPosting[subscriptionTier] || this.pricing.jobPosting.FREE_TIER;
  }

  calculateMarketplaceSlotPrice(subscriptionTier) {
    return this.pricing.marketplaceSlot[subscriptionTier] || this.pricing.marketplaceSlot.FREE_TIER;
  }

  calculateSubscriptionPrice(tier, billingPeriod) {
    const priceKey = `${tier}_${billingPeriod.toUpperCase()}`;
    return this.pricing.subscriptions[priceKey];
  }

  getPremiumUpgradePrice() {
    return this.pricing.solutionPremiumUpgrade;
  }

  // ==========================================
  // ADMIN STATISTICS METHODS
  // ==========================================

  async getPaymentStatistics(startDate, endDate, groupBy = 'DAY') {
    try {
      const matchStage = { status: 'completed' };
      
      if (startDate) {
        matchStage.createdAt = { $gte: new Date(startDate) };
      }
      if (endDate) {
        if (!matchStage.createdAt) matchStage.createdAt = {};
        matchStage.createdAt.$lte = new Date(endDate);
      }
      
      let groupStage;
      const now = new Date();
      
      switch (groupBy) {
        case 'DAY':
          groupStage = {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
              },
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              successful: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
              }
            }
          };
          break;
          
        case 'WEEK':
          groupStage = {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                week: { $week: '$createdAt' }
              },
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              successful: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
              }
            }
          };
          break;
          
        case 'MONTH':
          groupStage = {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              successful: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
              }
            }
          };
          break;
          
        case 'YEAR':
          groupStage = {
            $group: {
              _id: { year: { $year: '$createdAt' } },
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              successful: {
                $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
              }
            }
          };
          break;
          
        case 'TYPE':
          groupStage = {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              percentage: { $avg: 1 }
            }
          };
          break;
          
        case 'METHOD':
          groupStage = {
            $group: {
              _id: '$paymentMethod',
              count: { $sum: 1 },
              volume: { $sum: '$amount' },
              percentage: { $avg: 1 },
              successRate: {
                $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
              }
            }
          };
          break;
          
        default:
          throw new ValidationError('Invalid groupBy value');
      }
      
      // Get overall stats
      const totalStats = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            successfulPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            totalVolume: { $sum: '$amount' },
            averageTransactionValue: { $avg: '$amount' },
            platformRevenue: { $sum: { $multiply: ['$amount', 0.025] } }, // 2.5% platform fee
            gatewayRevenue: { $sum: { $multiply: ['$amount', 0.015] } } // 1.5% gateway fee
          }
        }
      ]);
      
      // Get stats by type
      const statsByType = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            volume: { $sum: '$amount' }
          }
        },
        {
          $addFields: {
            type: '$_id',
            percentage: {
              $multiply: [
                { $divide: ['$count', totalStats[0]?.totalPayments || 1] },
                100
              ]
            }
          }
        },
        { $project: { _id: 0 } }
      ]);
      
      // Get stats by method
      const statsByMethod = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            method: '$_id',
            percentage: {
              $multiply: [
                { $divide: ['$count', totalStats[0]?.totalPayments || 1] },
                100
              ]
            },
            successRate: {
              $multiply: [
                { $divide: ['$successful', '$count'] },
                100
              ]
            }
          }
        },
        { $project: { _id: 0 } }
      ]);
      
      // Get today's stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayStats = await Transaction.aggregate([
        {
          $match: {
            ...matchStage,
            createdAt: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      // Get this week's stats
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekStats = await Transaction.aggregate([
        {
          $match: {
            ...matchStage,
            createdAt: { $gte: weekStart }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      // Get this month's stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthStats = await Transaction.aggregate([
        {
          $match: {
            ...matchStage,
            createdAt: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      const total = totalStats[0] || {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        totalVolume: 0,
        averageTransactionValue: 0,
        platformRevenue: 0,
        gatewayRevenue: 0
      };
      
      const today = todayStats[0] || { count: 0, volume: 0, successful: 0, failed: 0 };
      const thisWeek = weekStats[0] || { count: 0, volume: 0, successful: 0, failed: 0 };
      const thisMonth = monthStats[0] || { count: 0, volume: 0, successful: 0, failed: 0 };
      
      return {
        totalPayments: total.totalPayments,
        successfulPayments: total.successfulPayments,
        failedPayments: total.failedPayments,
        totalVolume: total.totalVolume,
        averageTransactionValue: total.averageTransactionValue,
        conversionRate: total.totalPayments > 0 
          ? (total.successfulPayments / total.totalPayments) * 100 
          : 0,
        byType: statsByType,
        byMethod: statsByMethod,
        platformRevenue: total.platformRevenue,
        gatewayRevenue: total.gatewayRevenue,
        netRevenue: total.platformRevenue - total.gatewayRevenue,
        today: {
          date: todayStart,
          count: today.count,
          volume: today.volume,
          successful: today.successful,
          failed: today.failed
        },
        thisWeek: {
          week: Math.ceil((new Date().getDate() + 6) / 7),
          year: new Date().getFullYear(),
          count: thisWeek.count,
          volume: thisWeek.volume,
          successful: thisWeek.successful,
          failed: thisWeek.failed
        },
        thisMonth: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          count: thisMonth.count,
          volume: thisMonth.volume,
          successful: thisMonth.successful,
          failed: thisMonth.failed
        }
      };
      
    } catch (error) {
      logger.error('Get payment statistics error:', error);
      throw error;
    }
  }

  async retryPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new NotFoundError('Payment not found');
      }
      
      if (payment.status !== 'failed') {
        throw new ValidationError('Can only retry failed payments');
      }
      
      // Reset payment status
      payment.status = 'pending';
      payment.metadata.retryAttempts = (payment.metadata.retryAttempts || 0) + 1;
      payment.metadata.lastRetryAt = new Date();
      await payment.save();
      
      // If it's a virtual account payment, generate new account details
      if (payment.paymentMethod === 'virtual_account') {
        const user = await User.findById(payment.userId);
        const virtualAccount = await this.gateways.zainpay.createDynamicVirtualAccount({
          userId: payment.userId,
          amount: payment.amount / 100, // Convert from kobo to Naira
          email: user.email,
          metadata: {
            ...payment.metadata,
            originalPaymentId: paymentId,
            retry: true
          }
        });
        
        // Update payment with new reference
        payment.gatewayRef = virtualAccount.txnRef;
        payment.metadata.virtualAccountId = virtualAccount.virtualAccountId;
        await payment.save();
        
        return {
          success: true,
          payment,
          virtualAccountDetails: virtualAccount
        };
      }
      
      return { success: true, payment };
      
    } catch (error) {
      logger.error('Retry payment error:', error);
      throw error;
    }
  }

  // This is the new comprehensive refundPayment method that overrides the old one
  async refundPayment(input) {
    try {
      // Handle both object input and old-style parameters for backward compatibility
      let paymentId, amount, reason, metadata = {};
      
      if (typeof input === 'object' && input.paymentId) {
        // New style: object parameter
        ({ paymentId, amount, reason, metadata = {} } = input);
      } else {
        // Old style: separate parameters (maintained for backward compatibility)
        [paymentId, reason] = arguments;
        amount = undefined; // Will use full amount by default
      }
      
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new NotFoundError('Payment not found');
      }
      
      if (payment.status !== 'completed') {
        throw new ValidationError('Only completed payments can be refunded');
      }
      
      // If amount not specified, refund full amount
      if (!amount) {
        amount = payment.amount;
      }
      
      if (amount > payment.amount) {
        throw new ValidationError('Refund amount cannot exceed original payment amount');
      }
      
      // Check if already refunded
      const existingRefund = await Transaction.findOne({
        'metadata.refundOf': paymentId,
        status: { $in: ['success', 'pending'] }
      });
      
      if (existingRefund) {
        throw new ValidationError('Refund already in progress or completed');
      }
      
      // Create refund transaction
      const txnRef = `REFUND_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const refundTransaction = new Transaction({
        userId: payment.userId,
        txnRef,
        type: 'refund',
        amount: amount,
        currency: payment.currency,
        status: 'pending',
        gateway: payment.gateway,
        paymentMethod: payment.paymentMethod,
        description: `Refund for payment ${payment.reference}: ${reason}`,
        metadata: {
          refundOf: paymentId,
          originalReference: payment.reference,
          reason,
          ...metadata
        }
      });
      
      await refundTransaction.save();
      
      // Update payment status
      payment.status = amount === payment.amount ? 'refunded' : 'partially_refunded';
      payment.refundedAt = new Date();
      payment.metadata.refunds = [...(payment.metadata.refunds || []), {
        transactionId: refundTransaction._id,
        amount,
        reason,
        date: new Date()
      }];
      await payment.save();
      
      // Process refund based on gateway
      let refundResult;
      switch (payment.gateway) {
        case 'zainpay':
          // For Zainpay, we need to initiate a transfer back to the original payer
          // This requires storing the original payer's account details
          refundResult = await this.gateways.zainpay.transferToBank({
            userId: payment.userId,
            amount: amount / 100, // Convert to Naira
            accountNumber: payment.metadata.senderAccountNumber,
            bankCode: payment.metadata.senderBankCode,
            accountName: payment.metadata.senderName,
            narration: `Refund: ${reason}`,
            metadata: {
              refundTransactionId: refundTransaction._id,
              originalPaymentId: paymentId
            }
          });
          break;
          
        default:
          throw new ValidationError(`Refunds not supported for gateway: ${payment.gateway}`);
      }
      
      // Update refund transaction with gateway reference
      if (refundResult) {
        refundTransaction.gatewayRef = refundResult.reference;
        refundTransaction.status = refundResult.status || 'pending';
        await refundTransaction.save();
      }
      
      // Notify user
      const user = await User.findById(payment.userId);
      if (user) {
        await this.notificationService.createNotification({
          userId: user._id,
          type: 'refund_initiated',
          title: 'Refund Initiated',
          message: `Your refund of ₦${(amount / 100).toFixed(2)} has been initiated.`,
          data: {
            paymentId,
            refundTransactionId: refundTransaction._id,
            amount
          }
        });
        
        // Send email
        await this.emailService.sendRefundInitiated(
          user.email,
          user.firstName,
          amount / 100,
          payment.reference,
          reason
        );
      }
      
      logger.info('Refund initiated:', {
        paymentId,
        refundTransactionId: refundTransaction._id,
        amount,
        reason
      });
      
      return {
        success: true,
        refundTransaction,
        payment
      };
      
    } catch (error) {
      logger.error('Refund payment error:', error);
      throw error;
    }
  }

  // Helper method to maintain backward compatibility with old refund calls
  async refundTransaction(transactionId, reason) {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      // Find associated payment
      const payment = await Payment.findOne({ transactionId: transaction._id });
      if (!payment) {
        throw new NotFoundError('Payment not found for this transaction');
      }

      // Use the new refundPayment method
      return await this.refundPayment({
        paymentId: payment._id,
        amount: transaction.amount,
        reason,
        metadata: {
          originalTransactionId: transactionId
        }
      });
      
    } catch (error) {
      logger.error('Refund transaction error:', error);
      throw error;
    }
  }
}

export default new PaymentService();