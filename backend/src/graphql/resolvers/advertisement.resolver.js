// apps/backend/src/graphql/schema/resolvers/advertisement.resolver.js

import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { advertisementService, campaignService } from '../../services/advertisement/index.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';

export const advertisementResolver = {
  // ==========================================
  // QUERIES
  // ==========================================
  Query: {
    // Current User (Advertiser) Queries
    myAdvertiserProfile: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      return advertisementService.getAdvertiserProfile(user.id);
    },

    myCampaigns: async (_, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      return campaignService.getUserCampaigns(user.id, filter, pagination);
    },

    myAdvertisements: async (_, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      return advertisementService.getUserAdvertisements(user.id, filter, pagination);
    },

    myCampaignPerformance: async (_, { campaignId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to view this campaign');
      }
      
      return campaignService.getCampaignPerformance(campaignId);
    },

    myAdPerformance: async (_, { adId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to view this advertisement');
      }
      
      return advertisementService.getAdPerformance(adId);
    },

    // Public Queries
    availableAdSlots: async (_, { type, position, active }) => {
      return advertisementService.getAvailableAdSlots({ type, position, active });
    },

    adSlotDetails: async (_, { slotId }) => {
      const slot = await advertisementService.getAdSlotById(slotId);
      if (!slot) {
        throw new UserInputError('Ad slot not found');
      }
      return slot;
    },

    // Admin Queries
    allCampaigns: async (_, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      return campaignService.getAllCampaigns(filter, pagination);
    },

    allAdvertisements: async (_, { filter, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      return advertisementService.getAllAdvertisements(filter, pagination);
    },

    adStats: async (_, { startDate, endDate, groupBy }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      return advertisementService.getAdStats({ startDate, endDate, groupBy });
    },

    pendingApprovals: async (_, { type, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }
      
      return advertisementService.getPendingApprovals(type, pagination);
    },

    // Analytics Queries
    campaignAnalytics: async (_, { campaignId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      // Check if user is owner or admin
      const isOwner = campaign.advertiserId.toString() === user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role);
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('You do not have permission to view this campaign analytics');
      }
      
      return campaignService.getCampaignAnalytics(campaignId);
    },

    adAnalytics: async (_, { adId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      const isOwner = campaign.advertiserId.toString() === user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role);
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('You do not have permission to view this ad analytics');
      }
      
      return advertisementService.getAdAnalytics(adId);
    },
  },

  // ==========================================
  // MUTATIONS
  // ==========================================
  Mutation: {
    // Advertiser Registration & Profile
    registerAsAdvertiser: async (_, args, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const { companyName, companyLogo, website, contactEmail, contactPhone } = args;
      
      return advertisementService.registerAsAdvertiser(user.id, {
        companyName,
        companyLogo,
        website,
        contactEmail,
        contactPhone,
      });
    },

    updateAdvertiserProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return advertisementService.updateAdvertiserProfile(user.id, input);
    },

    // Campaign Mutations
    createCampaign: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Verify user is registered as advertiser
      const advertiser = await advertisementService.getAdvertiserProfile(user.id);
      if (!advertiser) {
        throw new ForbiddenError('You must register as an advertiser first');
      }
      
      return campaignService.createCampaign({
        ...input,
        advertiserId: user.id,
      });
    },

    updateCampaign: async (_, { campaignId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this campaign');
      }
      
      const updatedCampaign = await campaignService.updateCampaign(campaignId, input);
      
      // Publish update event
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: updatedCampaign,
      });
      
      return updatedCampaign;
    },

    updateCampaignStatus: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const { campaignId, status, reason } = input;
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this campaign');
      }
      
      const updatedCampaign = await campaignService.updateCampaignStatus(campaignId, status, reason);
      
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: updatedCampaign,
      });
      
      return updatedCampaign;
    },

    deleteCampaign: async (_, { campaignId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to delete this campaign');
      }
      
      await campaignService.deleteCampaign(campaignId);
      
      return {
        success: true,
        message: 'Campaign deleted successfully',
      };
    },

    duplicateCampaign: async (_, { campaignId, newName }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to duplicate this campaign');
      }
      
      return campaignService.duplicateCampaign(campaignId, newName, user.id);
    },

    // Advertisement Mutations
    createAdvertisement: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(input.campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to add ads to this campaign');
      }
      
      return advertisementService.createAdvertisement({
        ...input,
        createdBy: user.id,
      });
    },

    updateAdvertisement: async (_, { adId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      return advertisementService.updateAdvertisement(adId, input);
    },

    updateAdStatus: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const { adId, status, reason } = input;
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      return advertisementService.updateAdStatus(adId, status, reason);
    },

    deleteAdvertisement: async (_, { adId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to delete this advertisement');
      }
      
      await advertisementService.deleteAdvertisement(adId);
      
      return {
        success: true,
        message: 'Advertisement deleted successfully',
      };
    },

    duplicateAdvertisement: async (_, { adId, newName }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to duplicate this advertisement');
      }
      
      return advertisementService.duplicateAdvertisement(adId, newName);
    },

    // Bidding & Budget
    updateBid: async (_, { adId, bidAmount }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      if (bidAmount <= 0) {
        throw new UserInputError('Bid amount must be greater than 0');
      }
      
      return advertisementService.updateBid(adId, bidAmount);
    },

    updateBudget: async (_, { campaignId, budgetType, amount }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this campaign');
      }
      
      if (amount <= 0) {
        throw new UserInputError('Budget amount must be greater than 0');
      }
      
      const updatedCampaign = await campaignService.updateBudget(campaignId, budgetType, amount);
      
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: updatedCampaign,
      });
      
      return updatedCampaign;
    },

    addBudget: async (_, { campaignId, amount }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this campaign');
      }
      
      if (amount <= 0) {
        throw new UserInputError('Amount must be greater than 0');
      }
      
      const updatedCampaign = await campaignService.addBudget(campaignId, amount);
      
      pubsub.publish(EVENTS.CAMPAIGN_UPDATED, {
        campaignUpdated: updatedCampaign,
      });
      
      return updatedCampaign;
    },

    // Targeting & Schedule
    updateTargeting: async (_, { adId, targeting }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      return advertisementService.updateTargeting(adId, targeting);
    },

    updateSchedule: async (_, { adId, schedule }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      return advertisementService.updateSchedule(adId, schedule);
    },

    // Creative
    updateCreative: async (_, { adId, creative }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      if (campaign.advertiserId.toString() !== user.id) {
        throw new ForbiddenError('You do not have permission to update this advertisement');
      }
      
      // Reset approval status when creative changes
      return advertisementService.updateCreative(adId, creative);
    },

    // Admin Mutations
    approveAd: async (_, { adId, approved, reason }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to approve ads');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const updatedAd = await advertisementService.approveAd(adId, approved, reason, user.id);
      
      // Publish approval status change
      pubsub.publish(EVENTS.APPROVAL_STATUS_CHANGED, {
        approvalStatusChanged: {
          id: adId,
          type: 'AD_CREATIVE',
          item: updatedAd,
          submittedBy: ad.createdBy,
          submittedAt: ad.createdAt,
          status: approved ? 'APPROVED' : 'REJECTED',
          notes: reason,
        },
      });
      
      return updatedAd;
    },

    approveCampaign: async (_, { campaignId, approved, reason }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to approve campaigns');
      }
      
      const campaign = await campaignService.getCampaignById(campaignId);
      if (!campaign) {
        throw new UserInputError('Campaign not found');
      }
      
      const updatedCampaign = await campaignService.approveCampaign(campaignId, approved, reason, user.id);
      
      pubsub.publish(EVENTS.APPROVAL_STATUS_CHANGED, {
        approvalStatusChanged: {
          id: campaignId,
          type: 'CAMPAIGN_BUDGET',
          item: updatedCampaign,
          submittedBy: campaign.advertiserId,
          submittedAt: campaign.createdAt,
          status: approved ? 'APPROVED' : 'REJECTED',
          notes: reason,
        },
      });
      
      return updatedCampaign;
    },

    verifyAdvertiser: async (_, { advertiserId, verified, reason }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to verify advertisers');
      }
      
      return advertisementService.verifyAdvertiser(advertiserId, verified, reason, user.id);
    },

    // Ad Slot Management
    createAdSlot: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to create ad slots');
      }
      
      return advertisementService.createAdSlot(input);
    },

    updateAdSlot: async (_, { slotId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to update ad slots');
      }
      
      const slot = await advertisementService.getAdSlotById(slotId);
      if (!slot) {
        throw new UserInputError('Ad slot not found');
      }
      
      return advertisementService.updateAdSlot(slotId, input);
    },

    deleteAdSlot: async (_, { slotId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to delete ad slots');
      }
      
      const slot = await advertisementService.getAdSlotById(slotId);
      if (!slot) {
        throw new UserInputError('Ad slot not found');
      }
      
      await advertisementService.deleteAdSlot(slotId);
      
      return {
        success: true,
        message: 'Ad slot deleted successfully',
      };
    },

    // Testing
    previewAd: async (_, { adId, deviceType }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      const campaign = await campaignService.getCampaignById(ad.campaignId);
      const isOwner = campaign.advertiserId.toString() === user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role);
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenError('You do not have permission to preview this advertisement');
      }
      
      return advertisementService.generateAdPreview(adId, deviceType);
    },

    testAdTargeting: async (_, { adId, userId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to test ad targeting');
      }
      
      const ad = await advertisementService.getAdById(adId);
      if (!ad) {
        throw new UserInputError('Advertisement not found');
      }
      
      return advertisementService.testAdTargeting(adId, userId);
    },
  },

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  Subscription: {
    campaignUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.CAMPAIGN_UPDATED]),
        (payload, variables, context) => {
          if (!context.user) return false;
          
          const campaign = payload.campaignUpdated;
          
          // Only send to campaign owner or admins
          if (campaign.advertiserId.toString() === context.user.id) {
            return variables.campaignId === campaign.id;
          }
          
          if (['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(context.user.role)) {
            return variables.campaignId === campaign.id;
          }
          
          return false;
        }
      ),
    },

    adPerformanceUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.AD_PERFORMANCE_UPDATED]),
        async (payload, variables, context) => {
          if (!context.user) return false;
          
          const performance = payload.adPerformanceUpdated;
          
          if (variables.adId !== performance.adId) return false;
          
          // Verify access
          const ad = await advertisementService.getAdById(performance.adId);
          if (!ad) return false;
          
          const campaign = await campaignService.getCampaignById(ad.campaignId);
          
          if (campaign.advertiserId.toString() === context.user.id) {
            return true;
          }
          
          return ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(context.user.role);
        }
      ),
    },

    budgetAlert: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.BUDGET_ALERT]),
        async (payload, variables, context) => {
          if (!context.user) return false;
          
          const alert = payload.budgetAlert;
          
          if (variables.campaignId && variables.campaignId !== alert.campaign.id) {
            return false;
          }
          
          // Verify access
          const campaign = await campaignService.getCampaignById(alert.campaign.id);
          
          if (campaign.advertiserId.toString() === context.user.id) {
            return true;
          }
          
          return ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(context.user.role);
        }
      ),
    },

    approvalStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.APPROVAL_STATUS_CHANGED]),
        (payload, _, context) => {
          if (!context.user) return false;
          
          // Only admins receive approval status changes
          return ['ADMIN', 'SUPER_ADMIN', 'ADVERTISING_MANAGER'].includes(context.user.role);
        }
      ),
    },
  },

  // ==========================================
  // FIELD RESOLVERS
  // ==========================================
  Advertisement: {
    id: (parent) => parent._id || parent.id,
    
    campaign: async (parent, _, { loaders }) => {
      return loaders.campaignLoader.load(parent.campaignId.toString());
    },

    performance: async (parent) => {
      return advertisementService.getAdPerformance(parent._id || parent.id);
    },

    analytics: async (parent) => {
      return advertisementService.getAdAnalytics(parent._id || parent.id);
    },

    approvedBy: async (parent, _, { loaders }) => {
      if (!parent.approvedBy) return null;
      return loaders.userLoader.load(parent.approvedBy.toString());
    },

    targeting: (parent) => parent.targeting || {},
    
    approvedTargeting: (parent) => parent.approvedTargeting || null,
    
    schedule: (parent) => parent.schedule || null,
    
    approvedSchedule: (parent) => parent.approvedSchedule || null,
  },

  Campaign: {
    id: (parent) => parent._id || parent.id,
    
    advertiser: async (parent, _, { loaders }) => {
      return loaders.userLoader.load(parent.advertiserId.toString());
    },

    advertisements: async (parent) => {
      return advertisementService.getAdsByCampaignId(parent._id || parent.id);
    },

    activeAds: async (parent) => {
      return advertisementService.getActiveAdsByCampaignId(parent._id || parent.id);
    },

    performance: async (parent) => {
      return campaignService.getCampaignPerformance(parent._id || parent.id);
    },

    analytics: async (parent) => {
      return campaignService.getCampaignAnalytics(parent._id || parent.id);
    },

    remainingBudget: (parent) => {
      return parent.totalBudget - (parent.spentAmount || 0);
    },

    goalCompletion: (parent) => {
      if (!parent.goalValue || parent.goalValue === 0) return 0;
      return ((parent.currentGoalProgress || 0) / parent.goalValue) * 100;
    },

    durationDays: (parent) => {
      const start = new Date(parent.startDate);
      const end = new Date(parent.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
  },

  Advertiser: {
    id: (parent) => parent._id || parent.id,
    
    user: async (parent, _, { loaders }) => {
      return loaders.userLoader.load(parent.userId.toString());
    },

    totalCampaigns: async (parent) => {
      return campaignService.countCampaignsByAdvertiser(parent.userId);
    },

    activeCampaigns: async (parent) => {
      return campaignService.countActiveCampaignsByAdvertiser(parent.userId);
    },

    totalSpent: async (parent) => {
      return campaignService.getTotalSpentByAdvertiser(parent.userId);
    },

    averageRoas: async (parent) => {
      return campaignService.getAverageRoasByAdvertiser(parent.userId);
    },
  },

  AdSlot: {
    id: (parent) => parent._id || parent.id,
    
    aspectRatio: (parent) => {
      if (!parent.width || !parent.height) return '1:1';
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(parent.width, parent.height);
      return `${parent.width / divisor}:${parent.height / divisor}`;
    },
  },

  AdPerformance: {
    ctr: (parent) => {
      if (!parent.impressions || parent.impressions === 0) return 0;
      return (parent.clicks / parent.impressions) * 100;
    },

    conversionRate: (parent) => {
      if (!parent.clicks || parent.clicks === 0) return 0;
      return (parent.conversions / parent.clicks) * 100;
    },

    cpc: (parent) => {
      if (!parent.clicks || parent.clicks === 0) return 0;
      return parent.spentAmount / parent.clicks;
    },

    cpm: (parent) => {
      if (!parent.impressions || parent.impressions === 0) return 0;
      return (parent.spentAmount / parent.impressions) * 1000;
    },

    engagementRate: (parent) => {
      if (!parent.impressions || parent.impressions === 0) return 0;
      return (parent.engagements / parent.impressions) * 100;
    },
  },

  CampaignPerformance: {
    averageCtr: (parent) => {
      if (!parent.totalImpressions || parent.totalImpressions === 0) return 0;
      return (parent.totalClicks / parent.totalImpressions) * 100;
    },

    averageCpc: (parent) => {
      if (!parent.totalClicks || parent.totalClicks === 0) return 0;
      return parent.totalSpent / parent.totalClicks;
    },

    averageCpm: (parent) => {
      if (!parent.totalImpressions || parent.totalImpressions === 0) return 0;
      return (parent.totalSpent / parent.totalImpressions) * 1000;
    },

    goalCompletion: (parent) => {
      if (!parent.goalValue || parent.goalValue === 0) return 0;
      return (parent.goalProgress / parent.goalValue) * 100;
    },

    costPerGoal: (parent) => {
      if (!parent.goalProgress || parent.goalProgress === 0) return 0;
      return parent.totalSpent / parent.goalProgress;
    },
  },
};

export default advertisementResolver;