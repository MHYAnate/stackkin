import express from 'express';
import { advertisementService } from '../services/advertisement/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateRequest } from '../middleware/validator.middleware.js';
import { AppError } from '../errors/index.js';

const router = express.Router();

// Track ad impression (public endpoint)
router.post('/impression/:adId', 
  rateLimiter({ windowMs: 60000, max: 100 }), // 100 requests per minute
  async (req, res, next) => {
    try {
      const { adId } = req.params;
      const {
        userId,
        userAgent,
        ipAddress,
        deviceType,
        browser,
        os,
        screenSize,
        country,
        region,
        city,
        latitude,
        longitude,
        pageUrl,
        referrer,
        contentType,
        pageType,
        adPosition,
        sessionId,
        metadata
      } = req.body;

      const impression = await advertisementService.recordImpression(adId, {
        userId,
        userAgent: userAgent || req.headers['user-agent'],
        ipAddress: ipAddress || req.ip,
        deviceType,
        browser,
        os,
        screenSize,
        country,
        region,
        city,
        latitude,
        longitude,
        pageUrl,
        referrer: referrer || req.headers.referer,
        contentType,
        pageType,
        adPosition,
        sessionId,
        metadata
      });

      if (!impression) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ad not found or not active' 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: { impressionId: impression._id },
        message: 'Impression recorded'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Track ad click
router.post('/click/:impressionId',
  rateLimiter({ windowMs: 60000, max: 50 }),
  async (req, res, next) => {
    try {
      const { impressionId } = req.params;
      const { engagementDuration, clickThroughRate } = req.body;

      const impression = await advertisementService.recordClick(impressionId, {
        engagementDuration,
        clickThroughRate
      });

      if (!impression) {
        return res.status(404).json({ 
          success: false, 
          message: 'Impression not found or already clicked' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Click recorded'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Track ad conversion
router.post('/conversion/:impressionId',
  authMiddleware,
  rateLimiter({ windowMs: 60000, max: 20 }),
  async (req, res, next) => {
    try {
      const { impressionId } = req.params;
      const { revenue } = req.body;

      const impression = await advertisementService.recordConversion(impressionId, revenue);

      if (!impression) {
        return res.status(404).json({ 
          success: false, 
          message: 'Impression not found or already converted' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Conversion recorded'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get available ads for a position (public endpoint)
router.get('/available/:position',
  rateLimiter({ windowMs: 60000, max: 60 }),
  async (req, res, next) => {
    try {
      const { position } = req.params;
      const { 
        type, 
        format, 
        contentType, 
        pageType,
        country,
        deviceType,
        userId 
      } = req.query;

      // This would be a more complex service method to get relevant ads
      // For now, return simple response
      res.status(200).json({ 
        success: true, 
        data: [],
        message: 'Available ads endpoint'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get ad preview (authenticated)
router.get('/preview/:adId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { adId } = req.params;
      const { deviceType = 'DESKTOP' } = req.query;

      const preview = await advertisementService.generateAdPreview(adId, deviceType);

      res.status(200).json({ 
        success: true, 
        data: { preview },
        message: 'Ad preview generated'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Advertiser stats endpoint
router.get('/advertiser/stats',
  authMiddleware,
  async (req, res, next) => {
    try {
      const advertiser = await advertisementService.getAdvertiserProfile(req.user.id);
      
      if (!advertiser) {
        return res.status(404).json({ 
          success: false, 
          message: 'Advertiser not found' 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: advertiser,
        message: 'Advertiser stats retrieved'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;