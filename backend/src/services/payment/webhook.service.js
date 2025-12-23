import logger from '../../config/logger.js';
import zainpayService from './zainpay.service.js';
import paymentService from './payment.service.js';
import notificationService from '../notification/notification.service.js';
import Transaction from '../../models/Transaction.js';

class WebhookService {
  constructor() {
    this.handlers = {
      'zainpay': this.handleZainpayWebhook.bind(this)
    };
  }

  async handleWebhook(provider, event, payload, signature) {
    try {
      if (!this.handlers[provider]) {
        throw new Error(`Unsupported webhook provider: ${provider}`);
      }

      return await this.handlers[provider](event, payload, signature);
      
    } catch (error) {
      logger.error('Webhook handling error:', { provider, event, error });
      throw error;
    }
  }

  async handleZainpayWebhook(event, payload, signature) {
    try {
      // Verify the webhook signature first
      const isValid = zainpayService.verifyWebhookSignature(payload, signature);
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Process the webhook event
      const result = await paymentService.handleZainpayWebhook(payload, signature);
      
      // Log webhook processing
      await Transaction.create({
        txnRef: `WEBHOOK_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        type: 'deposit',
        amount: 0,
        status: 'success',
        gateway: 'zainpay',
        paymentMethod: 'webhook',
        description: `Webhook processed: ${event}`,
        webhookData: { event, payload, signature }
      });

      logger.info('Zainpay webhook processed successfully:', { event, txnRef: payload.data?.txnRef });
      
      return result;
      
    } catch (error) {
      logger.error('Zainpay webhook handling error:', { event, error });
      
      // Notify admin of webhook processing failure
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await notificationService.sendAdminAlert({
          type: 'webhook_failure',
          title: 'Webhook Processing Failed',
          message: `Failed to process Zainpay webhook: ${event}`,
          data: { event, error: error.message }
        });
      }
      
      throw error;
    }
  }

  async verifyAndProcessZainpayDeposit(txnRef, userId = null) {
    try {
      // This can be called from a cron job to verify pending transactions
      return await zainpayService.checkDynamicVirtualAccountStatus(txnRef, userId);
    } catch (error) {
      logger.error('Verify deposit error:', { txnRef, error });
      throw error;
    }
  }

  async verifyAndProcessCardPayment(txnRef, userId = null) {
    try {
      return await zainpayService.verifyCardPayment(txnRef, userId);
    } catch (error) {
      logger.error('Verify card payment error:', { txnRef, error });
      throw error;
    }
  }
}

export default new WebhookService();