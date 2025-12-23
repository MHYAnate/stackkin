import express from 'express';
import webhookService from '../services/payment/webhook.service.js';
import logger from '../config/logger.js';

const router = express.Router();

// Zainpay webhook endpoint
router.post('/zainpay', express.json({ verify: (req, res, buf) => {
  req.rawBody = buf.toString();
} }), async (req, res) => {
  try {
    const signature = req.headers['zainpay-signature'];
    const event = req.body.event;
    const payload = req.body;

    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const result = await webhookService.handleZainpayWebhook(event, payload, signature);

    res.status(200).json(result);
    
  } catch (error) {
    logger.error('Webhook route error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Zainpay DVA callback endpoint
router.post('/zainpay/dva-callback', express.json(), async (req, res) => {
  try {
    const { txnRef, status, depositedAmount } = req.body;

    logger.info('DVA callback received:', { txnRef, status });

    // Process the callback
    if (status === 'success') {
      await webhookService.verifyAndProcessZainpayDeposit(txnRef);
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    logger.error('DVA callback error:', error);
    res.status(200).json({ received: true }); // Always return 200 to Zainpay
  }
});

// Zainpay card callback endpoint
router.post('/zainpay/card-callback', express.json(), async (req, res) => {
  try {
    const { txnRef, status } = req.body;

    logger.info('Card callback received:', { txnRef, status });

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