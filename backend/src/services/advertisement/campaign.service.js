import Campaign from '../../models/Campaign.js';
import Advertisement from '../../models/Advertisement.js';
import Advertiser from '../../models/Advertiser.js';
import AdImpression from '../../models/AdImpression.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';
import cacheService from '../cache/cache.service.js';
import { v4 as uuidv4 } from 'uuid';

class CampaignService {
  // ==========================================
  // CAMPAIGN CRUD
  // ==========================================
  
  async createCampaign(data) {
    try {
      // Validate advertiser exists
      const advertiser = await Advertiser.findOne({ userId: data.advertiserId });
      if (!advertiser) {
        throw new ValidationError('User is not registered as an advertiser');
      }
      
      // Validate dates
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new ValidationError('Start date must be before end date');
      }
      
      // Check if advertiser has enough wallet balance
      if (advertiser.walletBalance < data.totalBudget) {
        throw new ValidationError('Insufficient wallet balance');
      }
      
      const campaign = new Campaign({
        ...data,
        status: 'DRAFT'
      });
      
      await campaign.save();
      
      // Deduct budget from wallet
      advertiser.walletBalance -= data.totalBudget;
      await advertiser.save();
      
      // Clear cache
      await cacheService.deletePattern(`campaigns:user:${data.advertiserId}:*`);
      await cacheService.deletePattern(`advertiser:${data.advertiserId}`);
      
      // Publish event
      pubsub.publish(EVENTS.CAMPAIGN_CREATED, {
        campaignCreated: campaign
      });
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create campaign: ${error.message}`, 500);
    }
  }
  
  async getCampaignById(campaignId) {
    try {
      const cacheKey = `campaign:${campaignId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const campaign = await Campaign.findById(campaignId)
        .populate('advertiserId', 'username email firstName lastName')
        .populate('approvedBy', 'username email');
      
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      await cacheService.set(cacheKey, JSON.stringify(campaign), 300); // 5 min cache
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get campaign: ${error.message}`, 500);
    }
  }
  
  async getUserCampaigns(userId, filter = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = '-createdAt' } = pagination;
      const cacheKey = `campaigns:user:${userId}:${JSON.stringify(filter)}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const query = { advertiserId: userId };
      
      // Apply filters
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { tags: { $regex: filter.search, $options: 'i' } }
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
          { path: 'advertiserId', select: 'username email' },
          { path: 'approvedBy', select: 'username email' }
        ]
      };
      
      const result = await Campaign.aggregatePaginate(
        Campaign.aggregate([
          { $match: query },
          { $sort: this._getSortObject(sortBy) }
        ]),
        options
      );
      
      await cacheService.set(cacheKey, JSON.stringify(result), 60); // 1 min cache
      
      return result;
    } catch (error) {
      throw new AppError(`Failed to get user campaigns: ${error.message}`, 500);
    }
  }
  
  async getAllCampaigns(filter = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = '-createdAt' } = pagination;
      const cacheKey = `campaigns:all:${JSON.stringify(filter)}:${page}:${limit}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const query = {};
      
      // Apply filters
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.advertiserId) {
        query.advertiserId = filter.advertiserId;
      }
      
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { tags: { $regex: filter.search, $options: 'i' } }
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
          { path: 'advertiserId', select: 'username email firstName lastName' },
          { path: 'approvedBy', select: 'username email' }
        ]
      };
      
      const result = await Campaign.aggregatePaginate(
        Campaign.aggregate([
          { $match: query },
          { $sort: this._getSortObject(sortBy) }
        ]),
        options
      );
      
      await cacheService.set(cacheKey, JSON.stringify(result), 30); // 30 sec cache
      
      return result;
    } catch (error) {
      throw new AppError(`Failed to get all campaigns: ${error.message}`, 500);
    }
  }
  
  async updateCampaign(campaignId, data) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Can't update if campaign is completed or cancelled
      if (['COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(campaign.status)) {
        throw new ValidationError(`Cannot update campaign with status: ${campaign.status}`);
      }
      
      // If budget is being increased, check wallet balance
      if (data.totalBudget && data.totalBudget > campaign.totalBudget) {
        const advertiser = await Advertiser.findOne({ userId: campaign.advertiserId });
        const additionalBudget = data.totalBudget - campaign.totalBudget;
        
        if (advertiser.walletBalance < additionalBudget) {
          throw new ValidationError('Insufficient wallet balance for budget increase');
        }
        
        // Deduct additional budget
        advertiser.walletBalance -= additionalBudget;
        await advertiser.save();
        
        await cacheService.deletePattern(`advertiser:${campaign.advertiserId}`);
      }
      
      Object.assign(campaign, data);
      await campaign.save();
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      await cacheService.deletePattern('campaigns:all:*');
      
      // Publish event
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: campaign
      });
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update campaign: ${error.message}`, 500);
    }
  }
  
  async updateCampaignStatus(campaignId, status, reason = null) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      const previousStatus = campaign.status;
      
      // Validate status transition
      const allowedTransitions = {
        DRAFT: ['ACTIVE', 'CANCELLED'],
        ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
        PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        COMPLETED: ['ARCHIVED'],
        CANCELLED: ['ARCHIVED'],
        ARCHIVED: []
      };
      
      if (!allowedTransitions[previousStatus]?.includes(status)) {
        throw new ValidationError(`Cannot transition from ${previousStatus} to ${status}`);
      }
      
      campaign.status = status;
      
      if (status === 'ACTIVE') {
        campaign.activatedAt = new Date();
      } else if (status === 'COMPLETED') {
        campaign.completedAt = new Date();
      }
      
      if (reason) {
        campaign.notes = campaign.notes ? `${campaign.notes}\n${reason}` : reason;
      }
      
      await campaign.save();
      
      // If campaign is being cancelled, refund remaining budget
      if (status === 'CANCELLED') {
        await this._refundCampaignBudget(campaign);
      }
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      await cacheService.deletePattern('campaigns:all:*');
      
      // Publish event
      pubsub.publish(EVENTS.CAMPAIGN_STATUS_CHANGED, {
        campaignStatusChanged: {
          campaignId: campaign._id,
          previousStatus,
          newStatus: status,
          reason
        }
      });
      
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: campaign
      });
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update campaign status: ${error.message}`, 500);
    }
  }
  
  async deleteCampaign(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Can only delete if no active ads
      const activeAds = await Advertisement.countDocuments({
        campaignId,
        status: 'ACTIVE'
      });
      
      if (activeAds > 0) {
        throw new ValidationError('Cannot delete campaign with active advertisements');
      }
      
      // Refund remaining budget
      await this._refundCampaignBudget(campaign);
      
      // Archive all ads
      await Advertisement.updateMany(
        { campaignId },
        { status: 'ARCHIVED' }
      );
      
      await campaign.deleteOne();
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      await cacheService.deletePattern('campaigns:all:*');
      await cacheService.deletePattern(`ads:campaign:${campaignId}:*`);
      
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to delete campaign: ${error.message}`, 500);
    }
  }
  
  async duplicateCampaign(campaignId, newName, userId) {
    try {
      const originalCampaign = await Campaign.findById(campaignId);
      if (!originalCampaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Check if user is the owner
      if (originalCampaign.advertiserId.toString() !== userId) {
        throw new ValidationError('Cannot duplicate campaign you do not own');
      }
      
      // Check advertiser wallet balance
      const advertiser = await Advertiser.findOne({ userId });
      if (advertiser.walletBalance < originalCampaign.totalBudget) {
        throw new ValidationError('Insufficient wallet balance to duplicate campaign');
      }
      
      // Create new campaign
      const duplicatedCampaign = new Campaign({
        ...originalCampaign.toObject(),
        _id: undefined,
        name: newName,
        status: 'DRAFT',
        approved: false,
        approvedBy: null,
        approvedAt: null,
        spentAmount: 0,
        currentGoalProgress: 0,
        performance: {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalSpent: 0,
          goalProgress: 0,
          efficiencyScore: 0,
          timeline: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        activatedAt: null,
        completedAt: null
      });
      
      await duplicatedCampaign.save();
      
      // Deduct budget from wallet
      advertiser.walletBalance -= originalCampaign.totalBudget;
      await advertiser.save();
      
      // Duplicate ads
      const originalAds = await Advertisement.find({ campaignId });
      for (const ad of originalAds) {
        const duplicatedAd = new Advertisement({
          ...ad.toObject(),
          _id: undefined,
          campaignId: duplicatedCampaign._id,
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
          updatedAt: new Date(),
          activatedAt: null,
          pausedAt: null,
          completedAt: null
        });
        
        await duplicatedAd.save();
      }
      
      // Clear cache
      await cacheService.deletePattern(`campaigns:user:${userId}:*`);
      await cacheService.deletePattern(`advertiser:${userId}`);
      
      return duplicatedCampaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to duplicate campaign: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // CAMPAIGN PERFORMANCE & ANALYTICS
  // ==========================================
  
  async getCampaignPerformance(campaignId) {
    try {
      const cacheKey = `campaign:${campaignId}:performance`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      // Get all ads in campaign
      const ads = await Advertisement.find({ campaignId });
      const adIds = ads.map(ad => ad._id);
      
      // Get impressions for all ads in campaign
      const impressions = await AdImpression.find({ advertisementId: { $in: adIds } });
      
      // Calculate metrics
      const totalImpressions = impressions.length;
      const totalClicks = impressions.filter(imp => imp.clickedAt).length;
      const totalConversions = impressions.filter(imp => imp.convertedAt).length;
      const totalSpent = ads.reduce((sum, ad) => sum + (ad.spentAmount || 0), 0);
      
      // Calculate goal progress based on goal type
      let goalProgress = 0;
      switch (campaign.goalType) {
        case 'IMPRESSIONS':
          goalProgress = totalImpressions;
          break;
        case 'CLICKS':
          goalProgress = totalClicks;
          break;
        case 'CONVERSIONS':
          goalProgress = totalConversions;
          break;
        case 'SALES':
          goalProgress = impressions.reduce((sum, imp) => sum + (imp.revenue || 0), 0);
          break;
        default:
          goalProgress = totalImpressions;
      }
      
      // Calculate timeline for last 30 days
      const timeline = [];
      const now = new Date();
      
      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayImpressions = impressions.filter(imp => 
          imp.viewedAt >= dayStart && imp.viewedAt < dayEnd
        );
        
        const daySpent = dayImpressions.reduce((sum, imp) => sum + (imp.cost || 0), 0);
        
        timeline.push({
          date: dayStart,
          impressions: dayImpressions.length,
          clicks: dayImpressions.filter(imp => imp.clickedAt).length,
          conversions: dayImpressions.filter(imp => imp.convertedAt).length,
          spent: daySpent
        });
      }
      
      const performance = {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpent,
        averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        averageCpc: totalClicks > 0 ? totalSpent / totalClicks : 0,
        averageCpm: totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0,
        roas: totalSpent > 0 ? 
          (impressions.reduce((sum, imp) => sum + (imp.revenue || 0), 0) / totalSpent) * 100 : 0,
        goalProgress,
        goalCompletion: campaign.goalValue > 0 ? (goalProgress / campaign.goalValue) * 100 : 0,
        costPerGoal: goalProgress > 0 ? totalSpent / goalProgress : 0,
        efficiencyScore: this._calculateEfficiencyScore(campaign, {
          totalImpressions,
          totalClicks,
          totalConversions,
          totalSpent
        }),
        timeline: timeline.reverse()
      };
      
      // Update campaign performance cache
      campaign.performance = performance;
      await campaign.save();
      
      await cacheService.set(cacheKey, JSON.stringify(performance), 60); // 1 min cache
      
      return performance;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get campaign performance: ${error.message}`, 500);
    }
  }
  
  async getCampaignAnalytics(campaignId) {
    try {
      const cacheKey = `campaign:${campaignId}:analytics`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      const ads = await Advertisement.find({ campaignId })
        .populate('createdBy', 'username email')
        .sort({ 'performance.clicks': -1 });
      
      // Get top and worst performing ads
      const topPerformingAds = ads
        .filter(ad => ad.performance?.clicks > 0)
        .sort((a, b) => (b.performance?.ctr || 0) - (a.performance?.ctr || 0))
        .slice(0, 5);
      
      const worstPerformingAds = ads
        .filter(ad => ad.performance?.impressions > 100) // Only consider ads with significant impressions
        .sort((a, b) => (a.performance?.ctr || 0) - (b.performance?.ctr || 0))
        .slice(0, 5);
      
      // Get demographic breakdown
      const adIds = ads.map(ad => ad._id);
      const impressions = await AdImpression.find({ 
        advertisementId: { $in: adIds },
        clickedAt: { $exists: true }
      });
      
      const demographicBreakdown = {
        ageDistribution: this._calculateAgeDistribution(impressions),
        genderDistribution: this._calculateGenderDistribution(impressions),
        locationDistribution: this._calculateLocationDistribution(impressions)
      };
      
      const geographicBreakdown = {
        countryDistribution: this._calculateCountryDistribution(impressions),
        cityDistribution: this._calculateCityDistribution(impressions)
      };
      
      const temporalBreakdown = {
        hourlyDistribution: this._calculateHourlyDistribution(impressions),
        dailyDistribution: this._calculateDailyDistribution(impressions),
        weeklyDistribution: this._calculateWeeklyDistribution(impressions)
      };
      
      // Generate recommendations
      const recommendations = this._generateRecommendations(campaign, ads);
      
      // Generate insights
      const insights = this._generateInsights(campaign, ads, impressions);
      
      const analytics = {
        topPerformingAds,
        worstPerformingAds,
        demographicBreakdown,
        geographicBreakdown,
        temporalBreakdown,
        recommendations,
        insights
      };
      
      await cacheService.set(cacheKey, JSON.stringify(analytics), 300); // 5 min cache
      
      return analytics;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get campaign analytics: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // BUDGET MANAGEMENT
  // ==========================================
  
  async updateBudget(campaignId, budgetType, amount) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      const advertiser = await Advertiser.findOne({ userId: campaign.advertiserId });
      if (!advertiser) {
        throw new NotFoundError('Advertiser not found');
      }
      
      // Calculate budget difference
      const currentBudget = budgetType === 'DAILY' ? campaign.dailyBudget : campaign.totalBudget;
      const budgetDifference = amount - (currentBudget || 0);
      
      if (budgetDifference > 0) {
        // Increasing budget - check wallet balance
        if (advertiser.walletBalance < budgetDifference) {
          throw new ValidationError('Insufficient wallet balance');
        }
        
        // Deduct from wallet
        advertiser.walletBalance -= budgetDifference;
        await advertiser.save();
        
        await cacheService.deletePattern(`advertiser:${campaign.advertiserId}`);
      } else if (budgetDifference < 0) {
        // Decreasing budget - refund to wallet
        advertiser.walletBalance += Math.abs(budgetDifference);
        await advertiser.save();
        
        await cacheService.deletePattern(`advertiser:${campaign.advertiserId}`);
      }
      
      // Update campaign budget
      if (budgetType === 'DAILY') {
        campaign.dailyBudget = amount;
      } else {
        campaign.totalBudget = amount;
      }
      
      campaign.budgetType = budgetType;
      await campaign.save();
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      
      // Check for budget alerts
      await this._checkBudgetAlerts(campaign);
      
      // Publish event
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: campaign
      });
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to update budget: ${error.message}`, 500);
    }
  }
  
  async addBudget(campaignId, amount) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      const advertiser = await Advertiser.findOne({ userId: campaign.advertiserId });
      if (!advertiser) {
        throw new NotFoundError('Advertiser not found');
      }
      
      // Check wallet balance
      if (advertiser.walletBalance < amount) {
        throw new ValidationError('Insufficient wallet balance');
      }
      
      // Deduct from wallet
      advertiser.walletBalance -= amount;
      await advertiser.save();
      
      // Increase campaign budget
      campaign.totalBudget += amount;
      await campaign.save();
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      await cacheService.deletePattern(`advertiser:${campaign.advertiserId}`);
      
      // Check for budget alerts
      await this._checkBudgetAlerts(campaign);
      
      // Publish event
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: campaign
      });
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to add budget: ${error.message}`, 500);
    }
  }
  
  async approveCampaign(campaignId, approved, reason = null, approvedBy) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }
      
      campaign.approved = approved;
      campaign.approvedBy = approvedBy;
      campaign.approvedAt = new Date();
      
      if (approved) {
        campaign.status = 'ACTIVE';
        campaign.activatedAt = new Date();
      } else {
        campaign.status = 'DRAFT';
        if (reason) {
          campaign.notes = campaign.notes ? `${campaign.notes}\n${reason}` : reason;
        }
      }
      
      await campaign.save();
      
      // Clear cache
      await cacheService.deletePattern(`campaign:${campaignId}`);
      await cacheService.deletePattern(`campaigns:user:${campaign.advertiserId}:*`);
      await cacheService.deletePattern('campaigns:all:*');
      await cacheService.deletePattern('approvals:*');
      
      return campaign;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to approve campaign: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // STATISTICS & HELPER METHODS
  // ==========================================
  
  async countCampaignsByAdvertiser(advertiserId) {
    try {
      const cacheKey = `campaigns:count:${advertiserId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return parseInt(cached);
      }
      
      const count = await Campaign.countDocuments({ advertiserId });
      
      await cacheService.set(cacheKey, count.toString(), 300); // 5 min cache
      
      return count;
    } catch (error) {
      throw new AppError(`Failed to count campaigns: ${error.message}`, 500);
    }
  }
  
  async countActiveCampaignsByAdvertiser(advertiserId) {
    try {
      const cacheKey = `campaigns:active:count:${advertiserId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return parseInt(cached);
      }
      
      const count = await Campaign.countDocuments({ 
        advertiserId, 
        status: 'ACTIVE' 
      });
      
      await cacheService.set(cacheKey, count.toString(), 300); // 5 min cache
      
      return count;
    } catch (error) {
      throw new AppError(`Failed to count active campaigns: ${error.message}`, 500);
    }
  }
  
  async getTotalSpentByAdvertiser(advertiserId) {
    try {
      const cacheKey = `campaigns:spent:${advertiserId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return parseInt(cached);
      }
      
      const result = await Campaign.aggregate([
        { $match: { advertiserId: advertiserId } },
        { $group: { _id: null, totalSpent: { $sum: '$spentAmount' } } }
      ]);
      
      const totalSpent = result[0]?.totalSpent || 0;
      
      await cacheService.set(cacheKey, totalSpent.toString(), 300); // 5 min cache
      
      return totalSpent;
    } catch (error) {
      throw new AppError(`Failed to get total spent: ${error.message}`, 500);
    }
  }
  
  async getAverageRoasByAdvertiser(advertiserId) {
    try {
      const cacheKey = `campaigns:roas:${advertiserId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return parseFloat(cached);
      }
      
      const campaigns = await Campaign.find({ advertiserId });
      let totalSpent = 0;
      let totalRevenue = 0;
      
      for (const campaign of campaigns) {
        totalSpent += campaign.spentAmount || 0;
        
        // Get revenue from impressions
        const ads = await Advertisement.find({ campaignId: campaign._id });
        const adIds = ads.map(ad => ad._id);
        
        const impressions = await AdImpression.find({ 
          advertisementId: { $in: adIds },
          convertedAt: { $exists: true }
        });
        
        totalRevenue += impressions.reduce((sum, imp) => sum + (imp.revenue || 0), 0);
      }
      
      const averageRoas = totalSpent > 0 ? (totalRevenue / totalSpent) * 100 : 0;
      
      await cacheService.set(cacheKey, averageRoas.toString(), 300); // 5 min cache
      
      return averageRoas;
    } catch (error) {
      throw new AppError(`Failed to get average ROAS: ${error.message}`, 500);
    }
  }
  
  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================
  
  async _refundCampaignBudget(campaign) {
    try {
      const advertiser = await Advertiser.findOne({ userId: campaign.advertiserId });
      if (!advertiser) return;
      
      const remainingBudget = campaign.totalBudget - (campaign.spentAmount || 0);
      
      if (remainingBudget > 0) {
        advertiser.walletBalance += remainingBudget;
        await advertiser.save();
        
        await cacheService.deletePattern(`advertiser:${campaign.advertiserId}`);
      }
    } catch (error) {
      console.error('Failed to refund campaign budget:', error);
    }
  }
  
  async _checkBudgetAlerts(campaign) {
    try {
      const alerts = [];
      const now = new Date();
      
      // Check daily budget
      if (campaign.dailyBudget && campaign.spentAmount > campaign.dailyBudget * 0.9) {
        alerts.push({
          campaign,
          alertType: campaign.spentAmount >= campaign.dailyBudget ? 
            'DAILY_LIMIT_REACHED' : 'DAILY_LIMIT_WARNING',
          message: campaign.spentAmount >= campaign.dailyBudget ?
            `Daily budget limit of ${campaign.dailyBudget} kobo reached` :
            `Daily budget (${campaign.dailyBudget} kobo) is 90% used`,
          threshold: campaign.dailyBudget,
          currentSpent: campaign.spentAmount,
          timestamp: now
        });
      }
      
      // Check total budget
      if (campaign.totalBudget && campaign.spentAmount > campaign.totalBudget * 0.9) {
        alerts.push({
          campaign,
          alertType: campaign.spentAmount >= campaign.totalBudget ? 
            'TOTAL_BUDGET_REACHED' : 'TOTAL_BUDGET_WARNING',
          message: campaign.spentAmount >= campaign.totalBudget ?
            `Total budget limit of ${campaign.totalBudget} kobo reached` :
            `Total budget (${campaign.totalBudget} kobo) is 90% used`,
          threshold: campaign.totalBudget,
          currentSpent: campaign.spentAmount,
          timestamp: now
        });
      }
      
      // Check advertiser wallet balance
      const advertiser = await Advertiser.findOne({ userId: campaign.advertiserId });
      if (advertiser && advertiser.walletBalance < advertiser.creditLimit * 0.1) {
        alerts.push({
          campaign,
          alertType: 'LOW_BALANCE',
          message: `Low wallet balance: ${advertiser.walletBalance} kobo remaining`,
          threshold: advertiser.creditLimit,
          currentSpent: advertiser.walletBalance,
          timestamp: now
        });
      }
      
      // Publish alerts
      for (const alert of alerts) {
        pubsub.publish(EVENTS.BUDGET_ALERT, {
          budgetAlert: alert
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Failed to check budget alerts:', error);
      return [];
    }
  }
  
  _calculateEfficiencyScore(campaign, metrics) {
    // Simple efficiency score calculation
    let score = 0;
    
    // CTR weight: 40%
    const ctrScore = Math.min(metrics.totalImpressions > 0 ? 
      (metrics.totalClicks / metrics.totalImpressions) * 100 * 40 : 0, 40);
    score += ctrScore;
    
    // Conversion rate weight: 30%
    const conversionScore = Math.min(metrics.totalClicks > 0 ? 
      (metrics.totalConversions / metrics.totalClicks) * 100 * 30 : 0, 30);
    score += conversionScore;
    
    // Budget utilization weight: 30%
    const budgetUtilization = campaign.totalBudget > 0 ? 
      (campaign.spentAmount / campaign.totalBudget) * 100 : 0;
    const budgetScore = Math.min(budgetUtilization * 0.3, 30);
    score += budgetScore;
    
    // Goal achievement bonus: 0-10 points
    const goalAchievement = campaign.goalValue > 0 ? 
      (metrics.goalProgress / campaign.goalValue) * 100 : 0;
    const goalBonus = Math.min(goalAchievement * 0.1, 10);
    score += goalBonus;
    
    return Math.min(score, 100);
  }
  
  _calculateAgeDistribution(impressions) {
    const distribution = {};
    impressions.forEach(imp => {
      const ageRange = imp.userAgeRange || 'UNKNOWN';
      distribution[ageRange] = (distribution[ageRange] || 0) + 1;
    });
    return distribution;
  }
  
  _calculateGenderDistribution(impressions) {
    const distribution = {};
    impressions.forEach(imp => {
      const gender = imp.userGender || 'UNKNOWN';
      distribution[gender] = (distribution[gender] || 0) + 1;
    });
    return distribution;
  }
  
  _calculateLocationDistribution(impressions) {
    const distribution = {};
    impressions.forEach(imp => {
      const location = imp.country || 'UNKNOWN';
      distribution[location] = (distribution[location] || 0) + 1;
    });
    return distribution;
  }
  
  _calculateCountryDistribution(impressions) {
    return this._calculateLocationDistribution(impressions);
  }
  
  _calculateCityDistribution(impressions) {
    const distribution = {};
    impressions.forEach(imp => {
      if (imp.city) {
        distribution[imp.city] = (distribution[imp.city] || 0) + 1;
      }
    });
    return distribution;
  }
  
  _calculateHourlyDistribution(impressions) {
    const distribution = Array(24).fill(0);
    impressions.forEach(imp => {
      const hour = imp.viewedAt.getHours();
      distribution[hour]++;
    });
    return distribution;
  }
  
  _calculateDailyDistribution(impressions) {
    const distribution = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0
    };
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    impressions.forEach(imp => {
      const day = days[imp.viewedAt.getDay()];
      distribution[day]++;
    });
    
    return distribution;
  }
  
  _calculateWeeklyDistribution(impressions) {
    const distribution = {};
    impressions.forEach(imp => {
      const week = this._getWeekNumber(imp.viewedAt);
      const key = `Week ${week}`;
      distribution[key] = (distribution[key] || 0) + 1;
    });
    return distribution;
  }
  
  _generateRecommendations(campaign, ads) {
    const recommendations = [];
    
    // Budget recommendations
    if (campaign.spentAmount > campaign.totalBudget * 0.8) {
      recommendations.push({
        type: 'BUDGET',
        priority: 'HIGH',
        title: 'Budget Nearly Exhausted',
        description: `Campaign budget is ${Math.round((campaign.spentAmount / campaign.totalBudget) * 100)}% used. Consider increasing budget or pausing campaign.`,
        action: 'Increase budget or pause campaign',
        impact: 0.8
      });
    }
    
    // Bidding recommendations
    const lowCtrAds = ads.filter(ad => 
      ad.performance?.impressions > 100 && 
      ad.performance?.ctr < 0.5
    );
    
    if (lowCtrAds.length > 0) {
      recommendations.push({
        type: 'BIDDING',
        priority: 'MEDIUM',
        title: 'Low CTR Ads Detected',
        description: `${lowCtrAds.length} ads have CTR below 0.5%. Consider optimizing creatives or adjusting bids.`,
        action: 'Review ad creatives and bidding strategy',
        impact: 0.6
      });
    }
    
    // Targeting recommendations
    if (campaign.targeting && Object.keys(campaign.targeting).length === 0) {
      recommendations.push({
        type: 'TARGETING',
        priority: 'HIGH',
        title: 'No Targeting Configured',
        description: 'Campaign is not using any targeting. Consider adding demographic, geographic, or interest targeting.',
        action: 'Configure campaign targeting',
        impact: 0.9
      });
    }
    
    // Creative recommendations
    const adsWithoutImages = ads.filter(ad => !ad.imageUrl && !ad.videoUrl);
    if (adsWithoutImages.length > 0) {
      recommendations.push({
        type: 'CREATIVE',
        priority: 'MEDIUM',
        title: 'Ads Missing Visuals',
        description: `${adsWithoutImages.length} ads don't have images or videos. Visual content typically performs better.`,
        action: 'Add images or videos to ads',
        impact: 0.7
      });
    }
    
    return recommendations;
  }
  
  _generateInsights(campaign, ads, impressions) {
    const insights = [];
    const now = new Date();
    
    // Performance insights
    const totalImpressions = ads.reduce((sum, ad) => sum + (ad.performance?.impressions || 0), 0);
    const totalClicks = ads.reduce((sum, ad) => sum + (ad.performance?.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    if (avgCtr > 2) {
      insights.push({
        type: 'PERFORMANCE',
        title: 'High CTR Performance',
        description: `Campaign CTR of ${avgCtr.toFixed(2)}% is above industry average (2%).`,
        data: { averageCtr: avgCtr, industryAverage: 2 },
        timestamp: now
      });
    }
    
    // Audience insights
    const topCountries = this._calculateCountryDistribution(impressions);
    const sortedCountries = Object.entries(topCountries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (sortedCountries.length > 0) {
      insights.push({
        type: 'AUDIENCE',
        title: 'Top Performing Countries',
        description: `Top 3 countries by impressions: ${sortedCountries.map(([country, count]) => `${country} (${count})`).join(', ')}`,
        data: { topCountries: sortedCountries },
        timestamp: now
      });
    }
    
    // Temporal insights
    const hourlyDistribution = this._calculateHourlyDistribution(impressions);
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    
    insights.push({
      type: 'TEMPORAL',
      title: 'Peak Engagement Hour',
      description: `Highest engagement occurs at ${peakHour}:00 (${hourlyDistribution[peakHour]} impressions).`,
      data: { peakHour, impressions: hourlyDistribution[peakHour], hourlyDistribution },
      timestamp: now
    });
    
    return insights;
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
}

export default new CampaignService();