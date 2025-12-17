import cron from 'node-cron';
import { advertisementService, campaignService } from '../services/advertisement/index.js';
import Campaign from '../models/Campaign.js';
import Advertisement from '../models/Advertisement.js';
import Advertiser from '../models/Advertiser.js';
import { AppError } from '../errors/index.js';

class AdvertisementJob {
  constructor() {
    this.jobs = [];
  }

  start() {
    // Run every hour: Update campaign and ad statuses
    this.jobs.push(cron.schedule('0 * * * *', this.updateStatuses.bind(this)));
    
    // Run every day at midnight: Generate daily reports
    this.jobs.push(cron.schedule('0 0 * * *', this.generateDailyReports.bind(this)));
    
    // Run every 6 hours: Check budget alerts
    this.jobs.push(cron.schedule('0 */6 * * *', this.checkBudgetAlerts.bind(this)));
    
    // Run every 30 minutes: Update performance metrics
    this.jobs.push(cron.schedule('*/30 * * * *', this.updatePerformanceMetrics.bind(this)));
    
    // Run every Sunday at 1 AM: Generate weekly analytics
    this.jobs.push(cron.schedule('0 1 * * 0', this.generateWeeklyAnalytics.bind(this)));
    
    console.log('Advertisement jobs started');
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('Advertisement jobs stopped');
  }

  async updateStatuses() {
    try {
      const now = new Date();
      
      // Update expired campaigns
      await Campaign.updateMany(
        {
          status: { $in: ['ACTIVE', 'PAUSED'] },
          endDate: { $lt: now }
        },
        {
          status: 'COMPLETED',
          completedAt: now
        }
      );
      
      // Update expired ads
      await Advertisement.updateMany(
        {
          status: { $in: ['ACTIVE', 'PAUSED'] },
          endDate: { $lt: now }
        },
        {
          status: 'EXPIRED'
        }
      );
      
      // Activate campaigns that should start
      await Campaign.updateMany(
        {
          status: 'DRAFT',
          startDate: { $lte: now },
          endDate: { $gte: now }
        },
        {
          status: 'ACTIVE',
          activatedAt: now
        }
      );
      
      // Activate ads that should start
      await Advertisement.updateMany(
        {
          status: 'DRAFT',
          startDate: { $lte: now },
          endDate: { $gte: now },
          approved: true
        },
        {
          status: 'ACTIVE',
          activatedAt: now
        }
      );
      
      console.log('Advertisement statuses updated');
    } catch (error) {
      console.error('Error updating advertisement statuses:', error);
    }
  }

  async generateDailyReports() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get daily stats
      const stats = await advertisementService.getAdStats({
        startDate: yesterday,
        endDate: today,
        groupBy: 'daily'
      });
      
      // Send report to admins (implementation depends on notification system)
      // For now, just log it
      console.log('Daily advertisement report:', {
        date: yesterday.toISOString().split('T')[0],
        ...stats
      });
      
      // Update advertiser stats
      const advertisers = await Advertiser.find();
      for (const advertiser of advertisers) {
        await advertisementService._updateAdvertiserStats(advertiser);
      }
      
      console.log('Daily advertisement reports generated');
    } catch (error) {
      console.error('Error generating daily reports:', error);
    }
  }

  async checkBudgetAlerts() {
    try {
      const campaigns = await Campaign.find({
        status: 'ACTIVE'
      }).populate('advertiserId');
      
      for (const campaign of campaigns) {
        await campaignService._checkBudgetAlerts(campaign);
      }
      
      console.log(`Budget alerts checked for ${campaigns.length} campaigns`);
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }

  async updatePerformanceMetrics() {
    try {
      const activeCampaigns = await Campaign.find({
        status: 'ACTIVE'
      });
      
      for (const campaign of activeCampaigns) {
        // Update campaign performance
        await campaignService.getCampaignPerformance(campaign._id);
        
        // Update ad performances
        const ads = await Advertisement.find({ campaignId: campaign._id });
        for (const ad of ads) {
          await advertisementService.getAdPerformance(ad._id);
        }
      }
      
      console.log(`Performance metrics updated for ${activeCampaigns.length} campaigns`);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  async generateWeeklyAnalytics() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const campaigns = await Campaign.find({
        updatedAt: { $gte: weekAgo }
      });
      
      for (const campaign of campaigns) {
        await campaignService.getCampaignAnalytics(campaign._id);
      }
      
      console.log(`Weekly analytics generated for ${campaigns.length} campaigns`);
    } catch (error) {
      console.error('Error generating weekly analytics:', error);
    }
  }

  // Manual job methods
  async recalculateAllStats() {
    try {
      console.log('Starting recalculation of all advertisement stats...');
      
      const campaigns = await Campaign.find();
      let processed = 0;
      
      for (const campaign of campaigns) {
        try {
          await campaignService.getCampaignPerformance(campaign._id);
          processed++;
          
          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${campaigns.length} campaigns`);
          }
        } catch (error) {
          console.error(`Error processing campaign ${campaign._id}:`, error.message);
        }
      }
      
      console.log(`Recalculation complete. Processed ${processed} campaigns.`);
    } catch (error) {
      console.error('Error in recalculateAllStats:', error);
      throw error;
    }
  }

  async cleanupOldImpressions(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await Advertisement.aggregate([
        {
          $match: {
            viewedAt: { $lt: cutoffDate }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);
      
      const countToDelete = result[0]?.count || 0;
      
      if (countToDelete > 0) {
        // In production, you might want to archive instead of delete
        await Advertisement.deleteMany({
          viewedAt: { $lt: cutoffDate }
        });
        
        console.log(`Cleaned up ${countToDelete} old impressions (older than ${days} days)`);
      } else {
        console.log('No old impressions to clean up');
      }
    } catch (error) {
      console.error('Error cleaning up old impressions:', error);
    }
  }
}

export default new AdvertisementJob();
