import cron from 'node-cron';
import logger from '../config/logger.js';
import zainpayService from '../services/payment/zainpay.service.js';
import Transaction from '../models/Transaction.js';
import VirtualAccount from '../models/VirtualAccount.js';

class PaymentJobs {
  constructor() {
    this.init();
  }

  init() {
    // Cleanup expired virtual accounts every hour
    cron.schedule('0 * * * *', this.cleanupExpiredAccounts.bind(this));
    
    // Verify pending transactions every 15 minutes
    cron.schedule('*/15 * * * *', this.verifyPendingTransactions.bind(this));
    
    // Send daily payment reports at 8 AM
    cron.schedule('0 8 * * *', this.sendDailyPaymentReport.bind(this));
    
    logger.info('Payment jobs initialized');
  }

  async cleanupExpiredAccounts() {
    try {
      const count = await zainpayService.cleanupExpiredVirtualAccounts();
      logger.info(`Expired accounts cleanup completed: ${count} accounts updated`);
    } catch (error) {
      logger.error('Expired accounts cleanup job error:', error);
    }
  }

  async verifyPendingTransactions() {
    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      
      // Find pending virtual account transactions older than 20 minutes
      const pendingTransactions = await Transaction.find({
        status: 'pending',
        paymentMethod: 'virtual_account',
        createdAt: { $lt: twentyMinutesAgo }
      }).limit(50);

      let verifiedCount = 0;
      
      for (const transaction of pendingTransactions) {
        try {
          await zainpayService.checkDynamicVirtualAccountStatus(
            transaction.txnRef,
            transaction.userId
          );
          verifiedCount++;
        } catch (error) {
          logger.error(`Failed to verify transaction ${transaction.txnRef}:`, error);
        }
      }

      logger.info(`Pending transactions verification completed: ${verifiedCount}/${pendingTransactions.length} verified`);
      
    } catch (error) {
      logger.error('Pending transactions verification job error:', error);
    }
  }

  async sendDailyPaymentReport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lt: today },
            status: 'success'
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalStats = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lt: today },
            status: 'success'
          }
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      logger.info('Daily payment report:', {
        date: yesterday.toDateString(),
        stats,
        totals: totalStats[0] || { totalCount: 0, totalAmount: 0 }
      });
      
      // Here you could send this report to admins via email
      
    } catch (error) {
      logger.error('Daily payment report job error:', error);
    }
  }
}

export default new PaymentJobs();