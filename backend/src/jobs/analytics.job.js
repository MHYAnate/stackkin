import cron from 'cron';
import analyticsService from '../services/analytics/analytics.service.js';
import metricsService from '../services/analytics/metrics.service.js';
import reportingService from '../services/analytics/reporting.service.js';

class AnalyticsJobs {
  constructor() {
    this.setupJobs();
  }

  setupJobs() {
    // Daily metric snapshot
    new cron.CronJob('0 0 * * *', this.dailyMetricSnapshot.bind(this)).start();
    
    // Hourly cache cleanup
    new cron.CronJob('0 * * * *', this.cacheCleanup.bind(this)).start();
    
    // Weekly report generation
    new cron.CronJob('0 0 * * 0', this.weeklyReports.bind(this)).start();
    
    // Real-time metrics update
    new cron.CronJob('*/5 * * * * *', this.realTimeUpdate.bind(this)).start();
    
    console.log('Analytics jobs scheduled');
  }

  async dailyMetricSnapshot() {
    try {
      console.log('Running daily metric snapshot...');
      
      const metrics = ['USERS', 'ACTIVITY', 'REVENUE', 'ENGAGEMENT'];
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      
      for (const metric of metrics) {
        const query = {
          period: 'CUSTOM',
          startDate: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          endDate: date
        };
        
        const value = await metricsService.calculateMetric(metric, query);
        
        // Save snapshot
        const snapshot = new (require('../models/MetricSnapshot.js').default)({
          metric,
          period: 'DAILY',
          date,
          value,
          previousValue: null, // Would be calculated from previous snapshot
          change: null,
          changePercentage: null,
          breakdown: [],
          trend: 'FLAT'
        });
        
        await snapshot.save();
      }
      
      console.log('Daily metric snapshot completed');
    } catch (error) {
      console.error('Error in daily metric snapshot:', error);
    }
  }

  async cacheCleanup() {
    try {
      console.log('Running cache cleanup...');
      
      // Clear expired cache entries
      const expired = await (require('../models/AnalyticsCache.js').default).deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      console.log(`Cleaned up ${expired.deletedCount} expired cache entries`);
    } catch (error) {
      console.error('Error in cache cleanup:', error);
    }
  }

  async weeklyReports() {
    try {
      console.log('Running weekly reports...');
      
      // Get all scheduled reports with weekly frequency
      const reports = await (require('../models/Report.js').default).find({
        'schedule.frequency': 'WEEKLY',
        status: 'ACTIVE'
      });
      
      for (const report of reports) {
        try {
          await reportingService.runReport(report._id, report.createdBy);
        } catch (error) {
          console.error(`Error running weekly report ${report._id}:`, error);
        }
      }
      
      console.log('Weekly reports completed');
    } catch (error) {
      console.error('Error in weekly reports:', error);
    }
  }

  async realTimeUpdate() {
    try {
      // Update real-time metrics in cache
      const metrics = await metricsService.getRealTimeMetrics();
      
      // Store in Redis for real-time access
      const redis = require('ioredis');
      const client = new redis(process.env.REDIS_URL);
      
      await client.setex(
        'realtime:metrics:current',
        10, // 10 second TTL
        JSON.stringify(metrics)
      );
      
      await client.quit();
    } catch (error) {
      console.error('Error in real-time update:', error);
    }
  }
}

export default new AnalyticsJobs();