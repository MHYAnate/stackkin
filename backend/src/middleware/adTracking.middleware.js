import useragent from 'useragent';
import geoip from 'geoip-lite';
import { advertisementService } from '../services/advertisement/index.js';

/**
 * Middleware to track ad impressions from ad tags
 */
export const adTrackingMiddleware = async (req, res, next) => {
  // Skip tracking for certain paths
  if (req.path.includes('/api/') || req.path.includes('/graphql')) {
    return next();
  }
  
  try {
    // Check if this is an ad request
    const adId = req.query.ad_id || req.headers['x-ad-id'];
    const position = req.query.position || req.headers['x-ad-position'];
    
    if (adId && position) {
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.connection.remoteAddress;
      
      // Parse user agent
      const agent = useragent.parse(userAgent);
      
      // Get location from IP
      const geo = geoip.lookup(ip);
      
      // Get referrer
      const referrer = req.headers.referer || req.headers.referrer;
      
      // Determine content type and page type from URL
      const { contentType, pageType } = analyzeUrl(req.url);
      
      // Record impression (async, don't wait)
      advertisementService.recordImpression(adId, {
        userId: req.user?._id,
        userAgent,
        ipAddress: ip,
        deviceType: getDeviceType(agent),
        browser: agent.family,
        os: agent.os.family,
        screenSize: req.headers['x-screen-size'] || 'unknown',
        country: geo?.country,
        region: geo?.region,
        city: geo?.city,
        latitude: geo?.ll?.[0],
        longitude: geo?.ll?.[1],
        pageUrl: req.originalUrl,
        referrer,
        contentType,
        pageType,
        adPosition: position,
        sessionId: req.sessionID,
        metadata: {
          query: req.query,
          headers: {
            'accept-language': req.headers['accept-language'],
            'x-forwarded-for': req.headers['x-forwarded-for']
          }
        }
      }).catch(error => {
        console.error('Failed to record ad impression:', error);
      });
      
      // Add tracking headers for client-side
      res.set('X-Ad-Tracked', 'true');
      res.set('X-Ad-ID', adId);
    }
  } catch (error) {
    // Don't block the request if tracking fails
    console.error('Ad tracking error:', error);
  }
  
  next();
};

// Helper functions
function getDeviceType(agent) {
  if (agent.device.family === 'iPhone' || agent.device.family === 'iPad' || 
      agent.device.family === 'Android' || agent.device.family === 'Mobile') {
    return 'MOBILE';
  } else if (agent.device.family === 'Tablet') {
    return 'TABLET';
  } else {
    return 'DESKTOP';
  }
}

function analyzeUrl(url) {
  let contentType = 'OTHER';
  let pageType = 'OTHER';
  
  if (url.includes('/solutions')) {
    contentType = 'SOLUTION';
    pageType = url.includes('/solutions/') ? 'DETAIL' : 'LISTING';
  } else if (url.includes('/jobs')) {
    contentType = 'JOB';
    pageType = url.includes('/jobs/') ? 'DETAIL' : 'LISTING';
  } else if (url.includes('/marketplace')) {
    contentType = 'MARKETPLACE';
    pageType = url.includes('/marketplace/') ? 'DETAIL' : 'LISTING';
  } else if (url.includes('/profile')) {
    contentType = 'PROFILE';
    pageType = 'PROFILE';
  } else if (url.includes('/chat')) {
    contentType = 'CHAT';
    pageType = 'CHAT';
  } else if (url === '/') {
    pageType = 'HOME';
  }
  
  return { contentType, pageType };
}

export default adTrackingMiddleware;