import crypto from 'crypto';
import { AppError } from '../errors/index.js';
import logger from '../config/logger.js';

export class WebhookSecurity {
  constructor() {
    this.allowedIPs = new Set(process.env.WEBHOOK_ALLOWED_IPS?.split(',') || []);
    this.nonceCache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes
  }

  async verifyZainpayWebhook(req) {
    try {
      const { body, headers, ip, rawBody } = req;

      // 1. Check IP whitelist
      if (!this.isAllowedIP(ip)) {
        logger.warn(`Webhook from blocked IP: ${ip}`);
        throw new AppError('IP not allowed', 403);
      }

      // 2. Verify timestamp (prevent replay attacks)
      const timestamp = headers['x-zainpay-timestamp'];
      if (!timestamp) {
        throw new AppError('Missing timestamp header', 400);
      }

      const currentTime = Date.now();
      const timestampMs = parseInt(timestamp);
      
      if (isNaN(timestampMs) || Math.abs(currentTime - timestampMs) > this.maxAge) {
        throw new AppError('Webhook timestamp expired or invalid', 400);
      }

      // 3. Verify nonce (prevent replay)
      const nonce = headers['x-zainpay-nonce'];
      if (!nonce) {
        throw new AppError('Missing nonce header', 400);
      }

      if (this.nonceCache.has(nonce)) {
        throw new AppError('Duplicate webhook detected', 400);
      }
      this.nonceCache.set(nonce, true);

      // Clean old nonces periodically
      setTimeout(() => this.nonceCache.delete(nonce), this.maxAge * 2);

      // 4. Verify HMAC signature
      const signature = headers['zainpay-signature'];
      if (!signature) {
        throw new AppError('Missing signature header', 400);
      }

      const isValid = this.verifyHMACSignature(rawBody || body, signature);
      if (!isValid) {
        throw new AppError('Invalid signature', 401);
      }

      // 5. Validate payload structure
      this.validateZainpayPayload(body);

      return true;

    } catch (error) {
      logger.error('Webhook verification failed:', { error: error.message, ip: req.ip });
      throw error;
    }
  }

  isAllowedIP(ip) {
    if (process.env.NODE_ENV === 'development') return true;
    if (this.allowedIPs.size === 0) return true; // Allow all if not configured
    return this.allowedIPs.has(ip);
  }

  verifyHMACSignature(payload, signature) {
    try {
      const secret = process.env.ZAINPAY_WEBHOOK_SECRET;
      if (!secret) {
        logger.error('ZAINPAY_WEBHOOK_SECRET not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('HMAC verification error:', error);
      return false;
    }
  }

  validateZainpayPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new AppError('Invalid payload format', 400);
    }

    const requiredFields = ['event', 'data'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new AppError(`Missing required field: ${field}`, 400);
      }
    }

    // Validate event types
    const validEvents = [
      'deposit.success',
      'transfer.success',
      'transfer.failed',
      'card.payment.success',
      'card.payment.failed',
      'dispute.opened',
      'dispute.closed'
    ];

    if (!validEvents.includes(payload.event)) {
      throw new AppError(`Invalid event type: ${payload.event}`, 400);
    }

    return true;
  }

  // Utility method for middleware
  middleware() {
    return async (req, res, next) => {
      try {
        await this.verifyZainpayWebhook(req);
        next();
      } catch (error) {
        res.status(error.statusCode || 400).json({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

export default new WebhookSecurity();