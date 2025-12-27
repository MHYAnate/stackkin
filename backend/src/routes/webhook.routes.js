import express from 'express';
import webhookService from '../services/payment/webhook.service.js';
import { WebhookSecurity } from '../middleware/webhookSecurity.js';
import logger from '../config/logger.js';

const router = express.Router();

// Add middleware to capture raw body for signature verification
const rawBodyMiddleware = (req, res, next) => {
  req.rawBody = '';
  req.on('data', chunk => {
    req.rawBody += chunk.toString();
  });
  req.on('end', () => {
    try {
      req.body = JSON.parse(req.rawBody);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON payload' });
    }
  });
};

// Zainpay webhook endpoint with enhanced security
router.post('/zainpay', 
  rawBodyMiddleware,
  WebhookSecurity.middleware(),
  async (req, res) => {
    try {
      const { event, data } = req.body;
      const signature = req.headers['zainpay-signature'];

      logger.info('Processing secure webhook:', { 
        event, 
        txnRef: data?.txnRef,
        ip: req.ip 
      });

      const result = await webhookService.handleWebhook('zainpay', event, data, signature);

      // Always return 200 to Zainpay to prevent retries
      res.status(200).json({ 
        received: true,
        processed: true,
        timestamp: new Date().toISOString() 
      });
      
    } catch (error) {
      logger.error('Webhook route error:', error);
      // Still return 200 to prevent Zainpay from retrying
      res.status(200).json({ 
        received: true,
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
});

// DVA callback endpoint
router.post('/zainpay/dva-callback', rawBodyMiddleware, async (req, res) => {
  try {
    const { txnRef, status, depositedAmount } = req.body;

    logger.info('DVA callback received:', { txnRef, status, ip: req.ip });

    if (status === 'success') {
      await webhookService.verifyAndProcessZainpayDeposit(txnRef);
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    logger.error('DVA callback error:', error);
    res.status(200).json({ received: true });
  }
});

// Card callback endpoint
router.post('/zainpay/card-callback', rawBodyMiddleware, async (req, res) => {
  try {
    const { txnRef, status } = req.body;

    logger.info('Card callback received:', { txnRef, status, ip: req.ip });

    if (status === 'success') {
      await webhookService.verifyAndProcessCardPayment(txnRef);
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    logger.error('Card callback error:', error);
    res.status(200).json({ received: true });
  }
});

export default router;