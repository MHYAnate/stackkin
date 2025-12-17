import Advertisement from '../../models/Advertisement.js';
import Campaign from '../../models/Campaign.js';
import Advertiser from '../../models/Advertiser.js';
import AdSlot from '../../models/AdSlot.js';
import AdImpression from '../../models/AdImpression.js';
import User from '../../models/User.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';
import cacheService from '../cache/cache.service.js';
import { v4 as uuidv4 } from 'uuid';

class AdvertisementService {
  // ==========================================
  // ADVERTISEMENT CRUD
  // ==========================================
  
  async createAdvertisement(data) {
    try {
      // Validate campaign exists and user has access
      const campaign = await Campaign.findById(data.campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Check if advertiser has budget
      const advertiser = await Advertiser.findOne({ userId: data.createdBy });
      if (!advertiser) {
        throw new ValidationError('User is not registered as an advertiser');
      }
      
      // Calculate total budget for campaign validation
      const existingAds = await Advertisement.find({ campaignId: data.campaignId });
      const totalAdBudget = existingAds.reduce((sum, ad) => sum + (ad.totalBudget || 0), 0);
      
      if (totalAdBudget + (data.totalBudget || 0) > campaign.totalBudget) {
        throw new ValidationError('Total ad budget exceeds campaign budget');
      }
      
      // Validate dates
      if (new Date(data.startDate) < campaign.startDate) {
        throw new ValidationError('Ad start date cannot be before campaign start date');
      }
      
      if (new Date(data.endDate) > campaign.endDate) {
        throw new ValidationError('Ad end date cannot be after campaign end date');
      }
      
      const advertisement = new Advertisement({
        ...data,
        status: 'DRAFT'
      });
      
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ads:campaign:${data.campaignId}:*`);
      await cacheService.deletePattern(`ads:user:${data.createdBy}:*`);
      
      // Publish event
      pubsub.publish(EVENTS.AD_CREATED, {
        adCreated: advertisement
      });
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create advertisement: ${error.message}`, 500);
    }
  }
  
  async getAdById(adId) {
    try {
      const cacheKey = `ad:${adId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const advertisement = await Advertisement.findById(adId)
        .populate('campaignId', 'name status')
        .populate('createdBy', 'username email')
        .populate('approvedBy', 'username email');
      
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      await cacheService.set(cacheKey, JSON.stringify(advertisement), 300); // 5 min cache
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get advertisement: ${error.message}`, 500);
    }
  }
  
  async getUserAdvertisements(userId, filter = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = '-createdAt' } = pagination;
      const cacheKey = `ads:user:${userId}:${JSON.stringify(filter)}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Get user's campaigns
      const userCampaigns = await Campaign.find({ advertiserId: userId }).select('_id');
      const campaignIds = userCampaigns.map(campaign => campaign._id);
      
      const query = { campaignId: { $in: campaignIds } };
      
      // Apply filters
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.type) {
        query.type = filter.type;
      }
      
      if (filter.format) {
        query.format = filter.format;
      }
      
      if (filter.campaignId) {
        query.campaignId = filter.campaignId;
      }
      
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } }
        ];
      }
      
      if (filter.startDate && filter.endDate) {
        query.createdAt = {
          $gte: new Date(filter.startDate),
          $lte: new Date(filter.endDate)
        };
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'campaignId', select: 'name status' },
          { path: 'createdBy', select: 'username email' }
        ]
      };
      
      const result = await Advertisement.aggregatePaginate(
        Advertisement.aggregate([
          { $match: query },
          { $sort: this._getSortObject(sortBy) }
        ]),
        options
      );
      
      await cacheService.set(cacheKey, JSON.stringify(result), 60); // 1 min cache
      
      return result;
    } catch (error) {
      throw new AppError(`Failed to get user advertisements: ${error.message}`, 500);
    }
  }
  
  async getAllAdvertisements(filter = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = '-createdAt' } = pagination;
      const cacheKey = `ads:all:${JSON.stringify(filter)}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const query = {};
      
      // Apply filters
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.type) {
        query.type = filter.type;
      }
      
      if (filter.format) {
        query.format = filter.format;
      }
      
      if (filter.campaignId) {
        query.campaignId = filter.campaignId;
      }
      
      if (filter.advertiserId) {
        const campaigns = await Campaign.find({ advertiserId: filter.advertiserId }).select('_id');
        const campaignIds = campaigns.map(campaign => campaign._id);
        query.campaignId = { $in: campaignIds };
      }
      
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } }
        ];
      }
      
      if (filter.startDate && filter.endDate) {
        query.createdAt = {
          $gte: new Date(filter.startDate),
          $lte: new Date(filter.endDate)
        };
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortBy,
        populate: [
          { path: 'campaignId', select: 'name advertiserId status', populate: { path: 'advertiserId', select: 'username email' } },
          { path: 'createdBy', select: 'username email' },
          { path: 'approvedBy', select: 'username email' }
        ]
      };
      
      const result = await Advertisement.aggregatePaginate(
        Advertisement.aggregate([
          { $match: query },
          { $sort: this._getSortObject(sortBy) }
        ]),
        options
      );
      
      await cacheService.set(cacheKey, JSON.stringify(result), 30); // 30 sec cache
      
      return result;
    } catch (error) {
      throw new AppError(`Failed to get all advertisements: ${error.message}`, 500);
    }
  }
  
  async updateAdvertisement(adId, data) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // If creative is being updated, reset approval
      const creativeFields = ['title', 'description', 'imageUrl', 'videoUrl', 'htmlContent', 'callToAction', 'destinationUrl'];
      const isCreativeUpdate = Object.keys(data).some(key => creativeFields.includes(key));
      
      if (isCreativeUpdate && advertisement.approved) {
        data.approved = false;
        data.approvedBy = null;
        data.approvedAt = null;
        data.approvedTargeting = null;
        data.approvedSchedule = null;
      }
      
      // Update targeting requires re-approval
      if (data.targeting && advertisement.approved) {
        data.approved = false;
        data.approvedBy = null;
        data.approvedAt = null;
        data.approvedTargeting = null;
      }
      
      // Update schedule requires re-approval
      if (data.schedule && advertisement.approved) {
        data.approved = false;
        data.approvedBy = null;
        data.approvedAt = null;
        data.approvedSchedule = null;
      }
      
      Object.assign(advertisement, data);
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      await cacheService.deletePattern(`ads:user:${advertisement.createdBy}:*`);
      
      // Publish event
      pubsub.publish(EVENTS.AD_UPDATED, {
        adUpdated: advertisement
      });
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update advertisement: ${error.message}`, 500);
    }
  }
  
  async updateAdStatus(adId, status, reason = null) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      const previousStatus = advertisement.status;
      advertisement.status = status;
      
      if (status === 'ACTIVE') {
        advertisement.activatedAt = new Date();
      } else if (status === 'PAUSED') {
        advertisement.pausedAt = new Date();
      } else if (status === 'COMPLETED') {
        advertisement.completedAt = new Date();
      }
      
      if (reason) {
        advertisement.rejectionReason = reason;
      }
      
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      
      // Publish event
      pubsub.publish(EVENTS.AD_STATUS_CHANGED, {
        adStatusChanged: {
          adId: advertisement._id,
          previousStatus,
          newStatus: status,
          reason
        }
      });
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update ad status: ${error.message}`, 500);
    }
  }
  
  async deleteAdvertisement(adId) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Can only delete if not active
      if (advertisement.status === 'ACTIVE') {
        throw new ValidationError('Cannot delete active advertisement. Pause it first.');
      }
      
      await advertisement.deleteOne();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      await cacheService.deletePattern(`ads:user:${advertisement.createdBy}:*`);
      
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete advertisement: ${error.message}`, 500);
    }
  }
  
  async duplicateAdvertisement(adId, newName) {
    try {
      const originalAd = await Advertisement.findById(adId);
      if (!originalAd) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Create a new ad with copied data
      const duplicatedAd = new Advertisement({
        ...originalAd.toObject(),
        _id: undefined,
        name: newName,
        status: 'DRAFT',
        approved: false,
        approvedBy: null,
        approvedAt: null,
        approvedTargeting: null,
        approvedSchedule: null,
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          views: 0,
          engagements: 0,
          shares: 0,
          comments: 0
        },
        spentAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await duplicatedAd.save();
      
      // Clear cache
      await cacheService.deletePattern(`ads:campaign:${duplicatedAd.campaignId}:*`);
      await cacheService.deletePattern(`ads:user:${duplicatedAd.createdBy}:*`);
      
      return duplicatedAd;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to duplicate advertisement: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // AD PERFORMANCE & ANALYTICS
  // ==========================================
  
  async getAdPerformance(adId) {
    try {
      const cacheKey = `ad:${adId}:performance`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Get performance from impressions
      const impressions = await AdImpression.find({ advertisementId: adId });
      
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate metrics
      const totalImpressions = impressions.length;
      const totalClicks = impressions.filter(imp => imp.clickedAt).length;
      const totalConversions = impressions.filter(imp => imp.convertedAt).length;
      const totalViews = impressions.filter(imp => imp.isViewable).length;
      
      // Calculate hourly metrics for last 24 hours
      const hourlyMetrics = [];
      for (let i = 0; i < 24; i++) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);
        
        const hourImpressions = impressions.filter(imp => 
          imp.viewedAt >= hourStart && imp.viewedAt < hourEnd
        );
        
        const hourClicks = hourImpressions.filter(imp => imp.clickedAt).length;
        
        hourlyMetrics.push({
          hour: hourStart.getHours(),
          impressions: hourImpressions.length,
          clicks: hourClicks,
          conversions: hourImpressions.filter(imp => imp.convertedAt).length,
          ctr: hourImpressions.length > 0 ? (hourClicks / hourImpressions.length) * 100 : 0
        });
      }
      
      // Calculate daily metrics for last 30 days
      const dailyMetrics = [];
      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayImpressions = impressions.filter(imp => 
          imp.viewedAt >= dayStart && imp.viewedAt < dayEnd
        );
        
        const dayClicks = dayImpressions.filter(imp => imp.clickedAt).length;
        const daySpent = dayImpressions.reduce((sum, imp) => sum + (imp.cost || 0), 0);
        
        dailyMetrics.push({
          date: dayStart,
          impressions: dayImpressions.length,
          clicks: dayClicks,
          conversions: dayImpressions.filter(imp => imp.convertedAt).length,
          spent: daySpent,
          ctr: dayImpressions.length > 0 ? (dayClicks / dayImpressions.length) * 100 : 0
        });
      }
      
      // Calculate weekly metrics for last 12 weeks
      const weeklyMetrics = [];
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const weekImpressions = impressions.filter(imp => 
          imp.viewedAt >= weekStart && imp.viewedAt < weekEnd
        );
        
        const weekSpent = weekImpressions.reduce((sum, imp) => sum + (imp.cost || 0), 0);
        
        weeklyMetrics.push({
          week: this._getWeekNumber(weekStart),
          year: weekStart.getFullYear(),
          impressions: weekImpressions.length,
          clicks: weekImpressions.filter(imp => imp.clickedAt).length,
          conversions: weekImpressions.filter(imp => imp.convertedAt).length,
          spent: weekSpent
        });
      }
      
      const performance = {
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        views: totalViews,
        engagements: advertisement.performance?.engagements || 0,
        shares: advertisement.performance?.shares || 0,
        comments: advertisement.performance?.comments || 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        cpc: totalClicks > 0 ? (advertisement.spentAmount / totalClicks) : 0,
        cpm: totalImpressions > 0 ? (advertisement.spentAmount / totalImpressions) * 1000 : 0,
        roas: advertisement.spentAmount > 0 ? 
          (impressions.reduce((sum, imp) => sum + (imp.revenue || 0), 0) / advertisement.spentAmount) * 100 : 0,
        qualityScore: advertisement.performance?.qualityScore || 0,
        relevanceScore: advertisement.performance?.relevanceScore || 0,
        engagementRate: totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0,
        hourly: hourlyMetrics.reverse(),
        daily: dailyMetrics.reverse(),
        weekly: weeklyMetrics.reverse(),
        lastUpdated: new Date()
      };
      
      // Update advertisement performance cache
      advertisement.performance = performance;
      await advertisement.save();
      
      await cacheService.set(cacheKey, JSON.stringify(performance), 60); // 1 min cache
      
      // Publish performance update
      pubsub.publish(EVENTS.AD_PERFORMANCE_UPDATED, {
        adPerformanceUpdated: {
          adId,
          ...performance
        }
      });
      
      return performance;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get ad performance: ${error.message}`, 500);
    }
  }
  
  async getAdAnalytics(adId) {
    try {
      const cacheKey = `ad:${adId}:analytics`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const impressions = await AdImpression.find({ advertisementId: adId });
      
      // Demographic analytics
      const ageGroups = ['UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_PLUS'];
      const byAge = ageGroups.map(ageRange => {
        const ageImpressions = impressions.filter(imp => imp.userAgeRange === ageRange);
        const clicks = ageImpressions.filter(imp => imp.clickedAt).length;
        return {
          ageRange,
          impressions: ageImpressions.length,
          clicks,
          ctr: ageImpressions.length > 0 ? (clicks / ageImpressions.length) * 100 : 0
        };
      });
      
      // Gender analytics
      const genders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
      const byGender = genders.map(gender => {
        const genderImpressions = impressions.filter(imp => imp.userGender === gender);
        const clicks = genderImpressions.filter(imp => imp.clickedAt).length;
        return {
          gender,
          impressions: genderImpressions.length,
          clicks,
          ctr: genderImpressions.length > 0 ? (clicks / genderImpressions.length) * 100 : 0
        };
      });
      
      // Geographic analytics
      const countries = [...new Set(impressions.map(imp => imp.country).filter(Boolean))];
      const byCountry = countries.map(country => {
        const countryImpressions = impressions.filter(imp => imp.country === country);
        const clicks = countryImpressions.filter(imp => imp.clickedAt).length;
        return {
          country,
          impressions: countryImpressions.length,
          clicks,
          ctr: countryImpressions.length > 0 ? (clicks / countryImpressions.length) * 100 : 0
        };
      }).sort((a, b) => b.impressions - a.impressions);
      
      // Device analytics
      const deviceTypes = ['DESKTOP', 'MOBILE', 'TABLET'];
      const byDeviceType = deviceTypes.map(deviceType => {
        const deviceImpressions = impressions.filter(imp => imp.deviceType === deviceType);
        const clicks = deviceImpressions.filter(imp => imp.clickedAt).length;
        return {
          deviceType,
          impressions: deviceImpressions.length,
          clicks,
          ctr: deviceImpressions.length > 0 ? (clicks / deviceImpressions.length) * 100 : 0
        };
      });
      
      const analytics = {
        demographics: {
          byAge,
          byGender,
          byEducation: [], // Would require education data
          byIncome: [] // Would require income data
        },
        geography: {
          byCountry,
          byRegion: [], // Would require region data
          byCity: [] // Would require city data
        },
        device: {
          byDeviceType,
          byOs: [], // Would require OS data
          byBrowser: [], // Would require browser data
          byScreenSize: [] // Would require screen size data
        },
        behavioral: {
          byInterest: [], // Would require interest data
          byBehavior: [], // Would require behavior data
          byEngagement: [] // Would require engagement data
        },
        contextual: {
          byCategory: [], // Would require category data
          byPageType: [], // Would require page type data
          byPosition: [] // Would require position data
        }
      };
      
      await cacheService.set(cacheKey, JSON.stringify(analytics), 300); // 5 min cache
      
      return analytics;
    } catch (error) {
      throw new AppError(`Failed to get ad analytics: ${error.message}`, 500);
    }
  }
  
  async recordImpression(adId, data) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement || advertisement.status !== 'ACTIVE') {
        return null;
      }
      
      // Check if ad is within schedule
      const now = new Date();
      if (now < advertisement.startDate || now > advertisement.endDate) {
        return null;
      }
      
      // Check targeting if available
      if (advertisement.targeting && !this._checkTargeting(advertisement.targeting, data)) {
        return null;
      }
      
      const impression = new AdImpression({
        advertisementId: adId,
        campaignId: advertisement.campaignId,
        userId: data.userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        screenSize: data.screenSize,
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        pageUrl: data.pageUrl,
        referrer: data.referrer,
        contentType: data.contentType,
        pageType: data.pageType,
        adPosition: data.adPosition,
        sessionId: data.sessionId,
        metadata: data.metadata
      });
      
      await impression.save();
      
      // Update advertisement impression count
      await Advertisement.updateOne(
        { _id: adId },
        { 
          $inc: { 
            'performance.impressions': 1,
            'performance.views': data.isViewable ? 1 : 0
          },
          $set: { 'performance.lastUpdated': new Date() }
        }
      );
      
      // Clear performance cache
      await cacheService.deletePattern(`ad:${adId}:performance`);
      await cacheService.deletePattern(`campaign:${advertisement.campaignId}:performance`);
      
      return impression;
    } catch (error) {
      console.error('Failed to record impression:', error);
      return null;
    }
  }
  
  async recordClick(impressionId, data = {}) {
    try {
      const impression = await AdImpression.findById(impressionId);
      if (!impression || impression.clickedAt) {
        return null;
      }
      
      impression.clickedAt = new Date();
      impression.engagementDuration = data.engagementDuration;
      impression.clickThroughRate = data.clickThroughRate;
      
      await impression.save();
      
      // Update advertisement click count
      await Advertisement.updateOne(
        { _id: impression.advertisementId },
        { 
          $inc: { 'performance.clicks': 1 },
          $set: { 'performance.lastUpdated': new Date() }
        }
      );
      
      // Update spent amount based on bidding type
      const advertisement = await Advertisement.findById(impression.advertisementId);
      if (advertisement) {
        let cost = 0;
        
        switch (advertisement.biddingType) {
          case 'CPC':
            cost = advertisement.bidAmount;
            break;
          case 'CPM':
            cost = advertisement.bidAmount / 1000; // Cost per mille (1000 impressions)
            break;
          case 'CPA':
            // Cost only on conversion
            break;
          default:
            cost = advertisement.bidAmount;
        }
        
        if (cost > 0) {
          advertisement.spentAmount += cost;
          await advertisement.save();
          
          // Update campaign spent amount
          await Campaign.updateOne(
            { _id: advertisement.campaignId },
            { $inc: { spentAmount: cost } }
          );
          
          // Update impression cost
          impression.cost = cost;
          await impression.save();
        }
      }
      
      // Clear caches
      await cacheService.deletePattern(`ad:${impression.advertisementId}:performance`);
      await cacheService.deletePattern(`campaign:${impression.campaignId}:performance`);
      
      return impression;
    } catch (error) {
      console.error('Failed to record click:', error);
      return null;
    }
  }
  
  async recordConversion(impressionId, revenue = 0) {
    try {
      const impression = await AdImpression.findById(impressionId);
      if (!impression || impression.convertedAt) {
        return null;
      }
      
      impression.convertedAt = new Date();
      impression.revenue = revenue;
      
      await impression.save();
      
      // Update advertisement conversion count
      await Advertisement.updateOne(
        { _id: impression.advertisementId },
        { 
          $inc: { 'performance.conversions': 1 },
          $set: { 'performance.lastUpdated': new Date() }
        }
      );
      
      // If CPA bidding, charge the bid amount
      const advertisement = await Advertisement.findById(impression.advertisementId);
      if (advertisement && advertisement.biddingType === 'CPA') {
        advertisement.spentAmount += advertisement.bidAmount;
        await advertisement.save();
        
        // Update campaign spent amount
        await Campaign.updateOne(
          { _id: advertisement.campaignId },
          { $inc: { spentAmount: advertisement.bidAmount } }
        );
        
        // Update impression cost
        impression.cost = advertisement.bidAmount;
        await impression.save();
      }
      
      // Clear caches
      await cacheService.deletePattern(`ad:${impression.advertisementId}:performance`);
      await cacheService.deletePattern(`campaign:${impression.campaignId}:performance`);
      
      return impression;
    } catch (error) {
      console.error('Failed to record conversion:', error);
      return null;
    }
  }
  
  // ==========================================
  // ADVERTISER MANAGEMENT
  // ==========================================
  
  async getAdvertiserProfile(userId) {
    try {
      const cacheKey = `advertiser:${userId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const advertiser = await Advertiser.findOne({ userId })
        .populate('userId', 'username email firstName lastName avatar')
        .populate('verifiedBy', 'username email');
      
      if (!advertiser) {
        return null;
      }
      
      // Update stats
      const stats = await this._updateAdvertiserStats(advertiser);
      Object.assign(advertiser, stats);
      
      await cacheService.set(cacheKey, JSON.stringify(advertiser), 300); // 5 min cache
      
      return advertiser;
    } catch (error) {
      throw new AppError(`Failed to get advertiser profile: ${error.message}`, 500);
    }
  }
  
  async registerAsAdvertiser(userId, data) {
    try {
      const existingAdvertiser = await Advertiser.findOne({ userId });
      if (existingAdvertiser) {
        throw new ValidationError('User is already registered as an advertiser');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      const advertiser = new Advertiser({
        userId,
        companyName: data.companyName || `${user.firstName || user.username}'s Business`,
        companyLogo: data.companyLogo,
        website: data.website,
        contactEmail: data.contactEmail || user.email,
        contactPhone: data.contactPhone,
        verificationStatus: 'PENDING'
      });
      
      await advertiser.save();
      
      // Update user role
      if (!user.roles.includes('ADVERTISER')) {
        user.roles.push('ADVERTISER');
        await user.save();
      }
      
      // Clear cache
      await cacheService.deletePattern(`advertiser:${userId}`);
      
      return advertiser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to register as advertiser: ${error.message}`, 500);
    }
  }
  
  async updateAdvertiserProfile(userId, data) {
    try {
      const advertiser = await Advertiser.findOne({ userId });
      if (!advertiser) {
        throw new NotFoundError('Advertiser not found');
      }
      
      Object.assign(advertiser, data);
      await advertiser.save();
      
      // Clear cache
      await cacheService.deletePattern(`advertiser:${userId}`);
      
      return advertiser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update advertiser profile: ${error.message}`, 500);
    }
  }
  
  async verifyAdvertiser(advertiserId, verified, reason = null, verifiedBy) {
    try {
      const advertiser = await Advertiser.findById(advertiserId);
      if (!advertiser) {
        throw new NotFoundError('Advertiser not found');
      }
      
      advertiser.verified = verified;
      advertiser.verificationStatus = verified ? 'VERIFIED' : 'REJECTED';
      advertiser.verificationReason = reason;
      advertiser.verifiedBy = verifiedBy;
      advertiser.verifiedAt = new Date();
      
      await advertiser.save();
      
      // Clear cache
      await cacheService.deletePattern(`advertiser:${advertiser.userId}`);
      
      return advertiser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to verify advertiser: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // AD SLOT MANAGEMENT
  // ==========================================
  
  async getAvailableAdSlots(filter = {}) {
    try {
      const cacheKey = `adslots:available:${JSON.stringify(filter)}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const query = { active: true };
      
      if (filter.type) {
        query.type = filter.type;
      }
      
      if (filter.position) {
        query.position = filter.position;
      }
      
      // Filter by availability
      if (filter.availableOnly) {
        query['availability.availableImpressions'] = { $gt: 0 };
      }
      
      const slots = await AdSlot.find(query)
        .populate('createdBy', 'username email')
        .sort({ basePrice: 1 });
      
      await cacheService.set(cacheKey, JSON.stringify(slots), 60); // 1 min cache
      
      return slots;
    } catch (error) {
      throw new AppError(`Failed to get available ad slots: ${error.message}`, 500);
    }
  }
  
  async getAdSlotById(slotId) {
    try {
      const cacheKey = `adslot:${slotId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const slot = await AdSlot.findById(slotId)
        .populate('createdBy', 'username email');
      
      if (!slot) {
        throw new NotFoundError('Ad slot not found');
      }
      
      await cacheService.set(cacheKey, JSON.stringify(slot), 300); // 5 min cache
      
      return slot;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get ad slot: ${error.message}`, 500);
    }
  }
  
  async createAdSlot(data) {
    try {
      const slot = new AdSlot(data);
      await slot.save();
      
      // Clear cache
      await cacheService.deletePattern('adslots:*');
      
      return slot;
    } catch (error) {
      throw new AppError(`Failed to create ad slot: ${error.message}`, 500);
    }
  }
  
  async updateAdSlot(slotId, data) {
    try {
      const slot = await AdSlot.findById(slotId);
      if (!slot) {
        throw new NotFoundError('Ad slot not found');
      }
      
      Object.assign(slot, data);
      await slot.save();
      
      // Clear cache
      await cacheService.deletePattern(`adslot:${slotId}`);
      await cacheService.deletePattern('adslots:*');
      
      return slot;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update ad slot: ${error.message}`, 500);
    }
  }
  
  async deleteAdSlot(slotId) {
    try {
      const slot = await AdSlot.findById(slotId);
      if (!slot) {
        throw new NotFoundError('Ad slot not found');
      }
      
      // Can't delete if there are active ads using this slot
      const activeAds = await Advertisement.countDocuments({
        status: 'ACTIVE',
        'targeting.contextual.placementPositions': slot.position
      });
      
      if (activeAds > 0) {
        throw new ValidationError('Cannot delete ad slot with active advertisements');
      }
      
      await slot.deleteOne();
      
      // Clear cache
      await cacheService.deletePattern(`adslot:${slotId}`);
      await cacheService.deletePattern('adslots:*');
      
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete ad slot: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // APPROVAL MANAGEMENT
  // ==========================================
  
  async getPendingApprovals(type = null, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      
      const query = { approved: false, status: 'PENDING_APPROVAL' };
      
      if (type === 'AD_CREATIVE') {
        // Ads with creative changes
        query.$or = [
          { 'performance.impressions': 0 }, // New ads
          { approved: false, $expr: { $ne: ['$targeting', '$approvedTargeting'] } }
        ];
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: '-createdAt',
        populate: [
          { path: 'campaignId', select: 'name advertiserId', populate: { path: 'advertiserId', select: 'username email' } },
          { path: 'createdBy', select: 'username email' }
        ]
      };
      
      const result = await Advertisement.aggregatePaginate(
        Advertisement.aggregate([{ $match: query }]),
        options
      );
      
      // Format as approval items
      const approvalItems = result.docs.map(ad => ({
        id: ad._id,
        type: 'AD_CREATIVE',
        item: ad,
        submittedBy: ad.createdBy,
        submittedAt: ad.createdAt,
        status: 'PENDING',
        notes: ad.rejectionReason
      }));
      
      return {
        ...result,
        docs: approvalItems
      };
    } catch (error) {
      throw new AppError(`Failed to get pending approvals: ${error.message}`, 500);
    }
  }
  
  async approveAd(adId, approved, reason = null, approvedBy) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      advertisement.approved = approved;
      advertisement.approvedBy = approvedBy;
      advertisement.approvedAt = new Date();
      
      if (approved) {
        advertisement.approvedTargeting = advertisement.targeting;
        advertisement.approvedSchedule = advertisement.schedule;
        advertisement.status = 'ACTIVE';
        advertisement.activatedAt = new Date();
      } else {
        advertisement.status = 'REJECTED';
        advertisement.rejectionReason = reason;
      }
      
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      await cacheService.deletePattern('approvals:*');
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to approve ad: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // STATISTICS & ANALYTICS
  // ==========================================
  
  async getAdStats(options = {}) {
    try {
      const { startDate, endDate, groupBy = 'daily' } = options;
      const cacheKey = `adstats:${startDate || 'all'}:${endDate || 'all'}:${groupBy}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const match = {};
      
      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      // Get total stats
      const [totalStats, byTypeStats, byStatusStats] = await Promise.all([
        // Total stats
        Advertisement.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalAds: { $sum: 1 },
              activeAds: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
              pendingAds: { $sum: { $cond: [{ $eq: ['$status', 'PENDING_APPROVAL'] }, 1, 0] } },
              totalSpent: { $sum: '$spentAmount' },
              totalImpressions: { $sum: '$performance.impressions' },
              totalClicks: { $sum: '$performance.clicks' }
            }
          }
        ]),
        
        // Stats by ad type
        Advertisement.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              impressions: { $sum: '$performance.impressions' },
              revenue: { $sum: '$spentAmount' }
            }
          },
          { $sort: { count: -1 } }
        ]),
        
        // Stats by campaign status
        Campaign.aggregate([
          { $match: match },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              spent: { $sum: '$spentAmount' }
            }
          }
        ])
      ]);
      
      const stats = {
        totalAds: totalStats[0]?.totalAds || 0,
        activeAds: totalStats[0]?.activeAds || 0,
        pendingAds: totalStats[0]?.pendingAds || 0,
        totalCampaigns: await Campaign.countDocuments(match),
        activeCampaigns: await Campaign.countDocuments({ ...match, status: 'ACTIVE' }),
        totalSpent: totalStats[0]?.totalSpent || 0,
        totalRevenue: totalStats[0]?.totalSpent || 0, // Assuming revenue equals spent for now
        
        fillRate: await this._calculateFillRate(),
        averageCtr: totalStats[0]?.totalImpressions > 0 ? 
          (totalStats[0]?.totalClicks / totalStats[0]?.totalImpressions) * 100 : 0,
        averageCpm: totalStats[0]?.totalImpressions > 0 ? 
          (totalStats[0]?.totalSpent / totalStats[0]?.totalImpressions) * 1000 : 0,
        
        byAdType: byTypeStats.map(stat => ({
          type: stat._id,
          count: stat.count,
          impressions: stat.impressions,
          revenue: stat.revenue
        })),
        
        byCampaignStatus: byStatusStats.map(stat => ({
          status: stat._id,
          count: stat.count,
          spent: stat.spent
        })),
        
        dailyRevenue: await this._getDailyRevenue(),
        monthlyRevenue: await this._getMonthlyRevenue(),
        yearlyRevenue: await this._getYearlyRevenue()
      };
      
      await cacheService.set(cacheKey, JSON.stringify(stats), 300); // 5 min cache
      
      return stats;
    } catch (error) {
      throw new AppError(`Failed to get ad stats: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // HELPER METHODS
  // ==========================================
  
  async _updateAdvertiserStats(advertiser) {
    try {
      const campaigns = await Campaign.find({ advertiserId: advertiser.userId });
      const campaignIds = campaigns.map(campaign => campaign._id);
      
      const [totalCampaigns, activeCampaigns, totalSpent, ads] = await Promise.all([
        campaigns.length,
        campaigns.filter(campaign => campaign.status === 'ACTIVE').length,
        campaigns.reduce((sum, campaign) => sum + (campaign.spentAmount || 0), 0),
        Advertisement.find({ campaignId: { $in: campaignIds } })
      ]);
      
      // Calculate average ROAS
      const totalRevenue = ads.reduce((sum, ad) => 
        sum + (ad.performance?.revenue || 0), 0
      );
      const averageRoas = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
      
      return {
        totalCampaigns,
        activeCampaigns,
        totalSpent,
        averageRoas
      };
    } catch (error) {
      console.error('Failed to update advertiser stats:', error);
      return {};
    }
  }
  
  _checkTargeting(targeting, userData) {
    // Implement targeting logic
    // This is a simplified version
    const now = new Date();
    
    // Check schedule
    if (targeting.schedule) {
      const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const hour = now.getHours();
      
      if (targeting.schedule.daysOfWeek && !targeting.schedule.daysOfWeek.includes(day)) {
        return false;
      }
      
      if (targeting.schedule.hoursOfDay && !targeting.schedule.hoursOfDay.includes(hour)) {
        return false;
      }
      
      if (targeting.schedule.blackoutDates) {
        const today = new Date(now.toDateString());
        if (targeting.schedule.blackoutDates.some(date => 
          new Date(date).toDateString() === today.toDateString()
        )) {
          return false;
        }
      }
    }
    
    // Check geography
    if (targeting.geography && userData.country) {
      if (targeting.geography.countries && 
          targeting.geography.countries.length > 0 &&
          !targeting.geography.countries.includes(userData.country)) {
        return false;
      }
    }
    
    // Check device
    if (targeting.device && userData.deviceType) {
      if (targeting.device.deviceTypes && 
          targeting.device.deviceTypes.length > 0 &&
          !targeting.device.deviceTypes.includes(userData.deviceType)) {
        return false;
      }
    }
    
    return true;
  }
  
  _getSortObject(sortBy) {
    const sort = {};
    const direction = sortBy.startsWith('-') ? -1 : 1;
    const field = sortBy.replace(/^-/, '');
    sort[field] = direction;
    return sort;
  }
  
  _getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }
  
  async _calculateFillRate() {
    const totalImpressions = await AdImpression.countDocuments();
    const availableSlots = await AdSlot.countDocuments({ active: true });
    
    if (availableSlots === 0) return 0;
    
    // This is a simplified calculation
    return Math.min((totalImpressions / (availableSlots * 1000)) * 100, 100);
  }
  
  async _getDailyRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await Advertisement.aggregate([
      {
        $match: {
          updatedAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$spentAmount' }
        }
      }
    ]);
    
    return result[0]?.revenue || 0;
  }
  
  async _getMonthlyRevenue() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const result = await Advertisement.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfMonth, $lt: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$spentAmount' }
        }
      }
    ]);
    
    return result[0]?.revenue || 0;
  }
  
  async _getYearlyRevenue() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
    
    const result = await Advertisement.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfYear, $lt: startOfNextYear }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$spentAmount' }
        }
      }
    ]);
    
    return result[0]?.revenue || 0;
  }
  
  // ==========================================
  // UTILITY METHODS FOR RESOLVERS
  // ==========================================
  
  async getAdsByCampaignId(campaignId) {
    try {
      const cacheKey = `ads:campaign:${campaignId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const ads = await Advertisement.find({ campaignId })
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 });
      
      await cacheService.set(cacheKey, JSON.stringify(ads), 60); // 1 min cache
      
      return ads;
    } catch (error) {
      throw new AppError(`Failed to get ads by campaign: ${error.message}`, 500);
    }
  }
  
  async getActiveAdsByCampaignId(campaignId) {
    try {
      const cacheKey = `ads:campaign:${campaignId}:active`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const ads = await Advertisement.find({ 
        campaignId, 
        status: 'ACTIVE',
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
      .populate('createdBy', 'username email')
      .sort({ bidAmount: -1 });
      
      await cacheService.set(cacheKey, JSON.stringify(ads), 30); // 30 sec cache
      
      return ads;
    } catch (error) {
      throw new AppError(`Failed to get active ads by campaign: ${error.message}`, 500);
    }
  }
  
  async updateBid(adId, bidAmount) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      advertisement.bidAmount = bidAmount;
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update bid: ${error.message}`, 500);
    }
  }
  
  async updateTargeting(adId, targeting) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Reset approval if targeting changes
      if (advertisement.approved) {
        advertisement.approved = false;
        advertisement.approvedBy = null;
        advertisement.approvedAt = null;
        advertisement.approvedTargeting = null;
      }
      
      advertisement.targeting = targeting;
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update targeting: ${error.message}`, 500);
    }
  }
  
  async updateSchedule(adId, schedule) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Reset approval if schedule changes
      if (advertisement.approved) {
        advertisement.approved = false;
        advertisement.approvedBy = null;
        advertisement.approvedAt = null;
        advertisement.approvedSchedule = null;
      }
      
      advertisement.schedule = schedule;
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update schedule: ${error.message}`, 500);
    }
  }
  
  async updateCreative(adId, creative) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Reset approval if creative changes
      if (advertisement.approved) {
        advertisement.approved = false;
        advertisement.approvedBy = null;
        advertisement.approvedAt = null;
      }
      
      Object.assign(advertisement, creative);
      await advertisement.save();
      
      // Clear cache
      await cacheService.deletePattern(`ad:${adId}`);
      await cacheService.deletePattern(`ads:campaign:${advertisement.campaignId}:*`);
      
      return advertisement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update creative: ${error.message}`, 500);
    }
  }
  
  async generateAdPreview(adId, deviceType = 'DESKTOP') {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      // Generate HTML preview based on ad type and format
      let preview = '';
      
      switch (advertisement.type) {
        case 'BANNER':
          preview = this._generateBannerPreview(advertisement, deviceType);
          break;
        case 'INTERSTITIAL':
          preview = this._generateInterstitialPreview(advertisement, deviceType);
          break;
        case 'VIDEO':
          preview = this._generateVideoPreview(advertisement, deviceType);
          break;
        case 'NATIVE':
          preview = this._generateNativePreview(advertisement, deviceType);
          break;
        default:
          preview = this._generateDefaultPreview(advertisement, deviceType);
      }
      
      return preview;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to generate preview: ${error.message}`, 500);
    }
  }
  
  async testAdTargeting(adId, userId) {
    try {
      const advertisement = await Advertisement.findById(adId);
      if (!advertisement) {
        throw new NotFoundError('Advertisement not found');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Get user data for targeting test
      const userData = {
        country: user.location?.country,
        deviceType: 'DESKTOP', // Default
        // Add more user data as needed
      };
      
      // Test targeting
      const passesTargeting = this._checkTargeting(advertisement.targeting, userData);
      
      return passesTargeting;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to test ad targeting: ${error.message}`, 500);
    }
  }
  
  _generateBannerPreview(ad, deviceType) {
    const width = deviceType === 'MOBILE' ? '320px' : '728px';
    const height = deviceType === 'MOBILE' ? '50px' : '90px';
    
    return `
      <div style="width: ${width}; height: ${height}; border: 2px dashed #ccc; padding: 10px; background: #f9f9f9;">
        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${ad.title}</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 5px;">${ad.description || ''}</div>
        ${ad.imageUrl ? `<img src="${ad.imageUrl}" style="max-width: 100%; max-height: 60px;" alt="${ad.title}">` : ''}
        <div style="margin-top: 5px;">
          <a href="${ad.destinationUrl}" style="background: #007bff; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 12px;">
            ${ad.callToAction}
          </a>
        </div>
        <div style="font-size: 10px; color: #999; margin-top: 5px;">Ad - ${ad.name}</div>
      </div>
    `;
  }
  
  _generateInterstitialPreview(ad, deviceType) {
    const size = deviceType === 'MOBILE' ? '300x250' : '600x400';
    
    return `
      <div style="width: 100%; height: 100vh; background: rgba(0,0,0,0.8); position: fixed; top: 0; left: 0; display: flex; justify-content: center; align-items: center;">
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: ${deviceType === 'MOBILE' ? '300px' : '600px'};">
          <div style="text-align: right; margin-bottom: 10px;">
            <button style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${ad.title}</div>
            <div style="margin-bottom: 15px;">${ad.description || ''}</div>
            ${ad.imageUrl ? `<img src="${ad.imageUrl}" style="max-width: 100%; margin-bottom: 15px;" alt="${ad.title}">` : ''}
            <div>
              <a href="${ad.destinationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                ${ad.callToAction}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  _generateVideoPreview(ad, deviceType) {
    return `
      <div style="max-width: ${deviceType === 'MOBILE' ? '320px' : '640px'}; margin: 0 auto;">
        <div style="background: #000; color: white; padding: 10px; font-weight: bold;">${ad.title}</div>
        <div style="background: #222; height: ${deviceType === 'MOBILE' ? '180px' : '360px'}; display: flex; justify-content: center; align-items: center;">
          ${ad.videoUrl ? `
            <video controls style="max-width: 100%; max-height: 100%;">
              <source src="${ad.videoUrl}" type="video/mp4">
            </video>
          ` : `
            <div style="text-align: center; color: #999;">
              <div style="font-size: 48px; margin-bottom: 10px;">▶️</div>
              <div>Video Ad Preview</div>
              <div style="font-size: 12px; margin-top: 5px;">${ad.videoUrl || 'No video URL provided'}</div>
            </div>
          `}
        </div>
        <div style="background: #333; color: #ccc; padding: 10px; font-size: 14px;">
          <div style="margin-bottom: 10px;">${ad.description || ''}</div>
          <a href="${ad.destinationUrl}" style="background: #ff6b00; color: white; padding: 8px 15px; text-decoration: none; border-radius: 3px; display: inline-block;">
            ${ad.callToAction}
          </a>
        </div>
      </div>
    `;
  }
  
  _generateNativePreview(ad, deviceType) {
    return `
      <div style="max-width: ${deviceType === 'MOBILE' ? '100%' : '800px'}; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 10px 0;">
        <div style="display: flex; gap: 15px; align-items: flex-start;">
          ${ad.imageUrl ? `
            <img src="${ad.imageUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" alt="${ad.title}">
          ` : ''}
          <div style="flex: 1;">
            <div style="font-weight: bold; color: #495057; margin-bottom: 5px;">${ad.title}</div>
            <div style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">${ad.description || ''}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <a href="${ad.destinationUrl}" style="color: #007bff; text-decoration: none; font-size: 14px;">
                ${ad.callToAction}
              </a>
              <span style="font-size: 12px; color: #adb5bd;">Sponsored</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  _generateDefaultPreview(ad, deviceType) {
    return `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: white;">
        <h4 style="margin-top: 0; color: #333;">${ad.name} (${ad.type} - ${ad.format})</h4>
        <div style="margin-bottom: 10px;">
          <strong>Title:</strong> ${ad.title}<br>
          <strong>Description:</strong> ${ad.description || 'N/A'}<br>
          <strong>CTA:</strong> ${ad.callToAction}<br>
          <strong>Destination:</strong> ${ad.destinationUrl}
        </div>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 3px; font-size: 12px;">
          <strong>Preview on:</strong> ${deviceType}<br>
          <strong>Status:</strong> ${ad.status}<br>
          <strong>Bid:</strong> ${ad.bidAmount} kobo (${ad.biddingType})
        </div>
      </div>
    `;
  }
}

export default new AdvertisementService();