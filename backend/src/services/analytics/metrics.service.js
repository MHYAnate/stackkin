import Event from '../../models/Event.js';
import Session from '../../models/Session.js';
import MetricSnapshot from '../../models/MetricSnapshot.js';
import AnalyticsCache from '../../models/AnalyticsCache.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class MetricsService {
  constructor() {
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || 300;
  }

  // ==========================================
  // METRIC QUERIES
  // ==========================================

  async getMetric(metric, query, user) {
    try {
      // Generate cache key
      const cacheKey = `metric:${metric}:${this.generateQueryHash(query)}:${user?.id || 'anonymous'}`;
      
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Calculate metric value
      const value = await this.calculateMetric(metric, query);
      
      // Get previous value for comparison
      const previousValue = await this.getPreviousMetricValue(metric, query);
      
      // Calculate change
      const change = previousValue ? value - previousValue : 0;
      const changePercentage = previousValue ? (change / previousValue) * 100 : 0;
      
      // Determine trend
      const trend = this.determineTrend(change, changePercentage);
      
      // Get breakdown if needed
      const breakdown = await this.getMetricBreakdown(metric, query);
      
      // Get timeline
      const timeline = await this.getMetricTimeline(metric, query);
      
      // Get target and progress
      const { target, achieved, progress } = await this.getMetricTarget(metric, query);
      
      const result = {
        type: metric,
        name: this.getMetricDisplayName(metric),
        value,
        previousValue,
        change,
        changePercentage,
        trend,
        breakdown,
        timeline,
        target,
        achieved,
        progress
      };

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, result, this.cacheTTL);
      }

      // Publish metric update
      pubsub.publish(EVENTS.METRIC_UPDATED, {
        metricUpdated: {
          metric,
          value,
          timestamp: new Date(),
          change
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting metric:', error);
      throw new Error(`Failed to get metric: ${error.message}`);
    }
  }

  // ==========================================
  // SUMMARY METRICS
  // ==========================================

  async getSummaryMetrics(query) {
    try {
      // Generate cache key
      const cacheKey = `summary:${this.generateQueryHash(query)}`;
      
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const dateRange = this.calculateDateRange(query.period, query.startDate, query.endDate);
      
      // Calculate all summary metrics in parallel
      const [
        totalUsers,
        newUsers,
        returningUsers,
        activeUsers,
        totalSessions,
        averageSessionDuration,
        pagesPerSession,
        bounceRate,
        totalRevenue,
        averageRevenuePerUser,
        conversionRate,
        totalEngagements,
        engagementRate,
        shares,
        comments,
        averageRating,
        satisfactionScore,
        netPromoterScore,
        growthRate,
        churnRate,
        viralCoefficient
      ] = await Promise.all([
        this.calculateTotalUsers(dateRange, query.filters),
        this.calculateNewUsers(dateRange, query.filters),
        this.calculateReturningUsers(dateRange, query.filters),
        this.calculateActiveUsers(dateRange, query.filters),
        this.calculateTotalSessions(dateRange, query.filters),
        this.calculateAverageSessionDuration(dateRange, query.filters),
        this.calculatePagesPerSession(dateRange, query.filters),
        this.calculateBounceRate(dateRange, query.filters),
        this.calculateTotalRevenue(dateRange, query.filters),
        this.calculateAverageRevenuePerUser(dateRange, query.filters),
        this.calculateConversionRate(dateRange, query.filters),
        this.calculateTotalEngagements(dateRange, query.filters),
        this.calculateEngagementRate(dateRange, query.filters),
        this.calculateShares(dateRange, query.filters),
        this.calculateComments(dateRange, query.filters),
        this.calculateAverageRating(dateRange, query.filters),
        this.calculateSatisfactionScore(dateRange, query.filters),
        this.calculateNetPromoterScore(dateRange, query.filters),
        this.calculateGrowthRate(dateRange, query.filters),
        this.calculateChurnRate(dateRange, query.filters),
        this.calculateViralCoefficient(dateRange, query.filters)
      ]);

      const summary = {
        // Users
        totalUsers,
        newUsers,
        returningUsers,
        activeUsers,
        
        // Activity
        totalSessions,
        averageSessionDuration,
        pagesPerSession,
        bounceRate,
        
        // Revenue
        totalRevenue,
        averageRevenuePerUser,
        conversionRate,
        
        // Engagement
        totalEngagements,
        engagementRate,
        shares,
        comments,
        
        // Quality
        averageRating,
        satisfactionScore,
        netPromoterScore,
        
        // Growth
        growthRate,
        churnRate,
        viralCoefficient
      };

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, summary, this.cacheTTL);
      }

      return summary;
    } catch (error) {
      console.error('Error getting summary metrics:', error);
      throw new Error(`Failed to get summary metrics: ${error.message}`);
    }
  }

  // ==========================================
  // REAL-TIME METRICS
  // ==========================================

  async getRealTimeMetrics() {
    try {
      const cacheKey = 'realtime:metrics';
      
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Calculate real-time metrics
      const [
        activeUsers,
        activeSessions,
        eventsPerSecond,
        recentEvents,
        updates,
        alerts
      ] = await Promise.all([
        this.calculateActiveUsersNow(),
        this.calculateActiveSessionsNow(),
        this.calculateEventsPerSecond(),
        this.getRecentEvents(50),
        this.getRecentUpdates(100),
        this.getActiveAlertsNow()
      ]);

      const result = {
        activeUsers,
        activeSessions,
        eventsPerSecond,
        recentEvents,
        updates,
        alerts,
        timestamp: now
      };

      // Cache with very short TTL (10 seconds) for real-time data
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, result, 10);
      }

      return result;
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw new Error(`Failed to get real-time metrics: ${error.message}`);
    }
  }

  async getLiveUpdates() {
    try {
      // Get recent updates from Redis pub/sub or database
      const updates = await redis.lrange('live:updates', 0, 99);
      
      return updates.map(update => JSON.parse(update)).filter(update => {
        // Only return updates from last 5 minutes
        const updateTime = new Date(update.timestamp);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return updateTime > fiveMinutesAgo;
      });
    } catch (error) {
      console.error('Error getting live updates:', error);
      return [];
    }
  }

  async getRecentEvents(limit = 50) {
    try {
      return await Event.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'name email avatar')
        .lean();
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  async getRecentUpdates(limit = 100) {
    try {
      // This would typically come from a real-time update stream
      // For now, return recent events as updates
      const events = await Event.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      return events.map(event => ({
        type: 'EVENT',
        data: event,
        timestamp: event.timestamp
      }));
    } catch (error) {
      console.error('Error getting recent updates:', error);
      return [];
    }
  }

  // ==========================================
  // METRIC CALCULATIONS
  // ==========================================

  async calculateMetric(metric, query) {
    const dateRange = this.calculateDateRange(query.period, query.startDate, query.endDate);
    
    switch (metric) {
      case 'USERS':
        return this.calculateTotalUsers(dateRange, query.filters);
      case 'ACTIVITY':
        return this.calculateTotalActivity(dateRange, query.filters);
      case 'REVENUE':
        return this.calculateTotalRevenue(dateRange, query.filters);
      case 'ENGAGEMENT':
        return this.calculateEngagementScore(dateRange, query.filters);
      case 'RETENTION':
        return this.calculateRetentionRate(dateRange, query.filters);
      case 'PERFORMANCE':
        return this.calculatePerformanceScore(dateRange, query.filters);
      case 'QUALITY':
        return this.calculateQualityScore(dateRange, query.filters);
      case 'GROWTH':
        return this.calculateGrowthRate(dateRange, query.filters);
      default:
        return this.calculateCustomMetric(metric, dateRange, query.filters);
    }
  }

  async calculateTotalUsers(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.userId = { $ne: null };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: { _id: '$userId' } },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating total users:', error);
      return 0;
    }
  }

  async calculateNewUsers(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'REGISTRATION';
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating new users:', error);
      return 0;
    }
  }

  async calculateReturningUsers(dateRange, filters) {
    try {
      // Get users who had events before the date range
      const beforeRange = {
        startDate: new Date(dateRange.startDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
        endDate: dateRange.startDate
      };
      
      const previousMatch = this.buildMatchStage(beforeRange, filters);
      previousMatch.userId = { $ne: null };
      
      const previousUsers = await Event.aggregate([
        { $match: previousMatch },
        { $group: { _id: '$userId' } }
      ]);
      
      const previousUserIds = previousUsers.map(user => user._id);
      
      // Get users in current period
      const currentMatch = this.buildMatchStage(dateRange, filters);
      currentMatch.userId = { $ne: null, $in: previousUserIds };
      
      const currentResult = await Event.aggregate([
        { $match: currentMatch },
        { $group: { _id: '$userId' } },
        { $count: 'total' }
      ]);
      
      return currentResult[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating returning users:', error);
      return 0;
    }
  }

  async calculateActiveUsers(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.userId = { $ne: null };
      
      // Active user: at least 3 events in the period
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: { 
          _id: '$userId',
          eventCount: { $sum: 1 }
        }},
        { $match: { eventCount: { $gte: 3 } } },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating active users:', error);
      return 0;
    }
  }

  async calculateTotalSessions(dateRange, filters) {
    try {
      const matchStage = {
        startTime: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      };
      
      if (filters) {
        this.applyFiltersToMatchStage(matchStage, filters);
      }
      
      const result = await Session.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating total sessions:', error);
      return 0;
    }
  }

  async calculateAverageSessionDuration(dateRange, filters) {
    try {
      const matchStage = {
        startTime: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        },
        duration: { $gt: 0 } // Only sessions with duration
      };
      
      if (filters) {
        this.applyFiltersToMatchStage(matchStage, filters);
      }
      
      const result = await Session.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          averageDuration: { $avg: '$duration' }
        }}
      ]);
      
      return Math.round(result[0]?.averageDuration || 0);
    } catch (error) {
      console.error('Error calculating average session duration:', error);
      return 0;
    }
  }

  async calculatePagesPerSession(dateRange, filters) {
    try {
      const matchStage = {
        startTime: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      };
      
      if (filters) {
        this.applyFiltersToMatchStage(matchStage, filters);
      }
      
      const result = await Session.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalPages: { $sum: '$pageCount' }
        }}
      ]);
      
      const data = result[0];
      if (!data || data.totalSessions === 0) return 0;
      
      return parseFloat((data.totalPages / data.totalSessions).toFixed(2));
    } catch (error) {
      console.error('Error calculating pages per session:', error);
      return 0;
    }
  }

  async calculateBounceRate(dateRange, filters) {
    try {
      const matchStage = {
        startTime: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate
        }
      };
      
      if (filters) {
        this.applyFiltersToMatchStage(matchStage, filters);
      }
      
      const result = await Session.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bouncedSessions: { 
            $sum: { 
              $cond: [{ $lte: ['$pageCount', 1] }, 1, 0] 
            }
          }
        }}
      ]);
      
      const data = result[0];
      if (!data || data.totalSessions === 0) return 0;
      
      return parseFloat(((data.bouncedSessions / data.totalSessions) * 100).toFixed(2));
    } catch (error) {
      console.error('Error calculating bounce rate:', error);
      return 0;
    }
  }

  async calculateTotalRevenue(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = { $in: ['PURCHASE', 'SUBSCRIPTION'] };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalRevenue: { 
            $sum: { $ifNull: ['$properties.amount', 0] }
          }
        }}
      ]);
      
      return result[0]?.totalRevenue || 0;
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      return 0;
    }
  }

  async calculateAverageRevenuePerUser(dateRange, filters) {
    try {
      const totalRevenue = await this.calculateTotalRevenue(dateRange, filters);
      const totalUsers = await this.calculateTotalUsers(dateRange, filters);
      
      if (totalUsers === 0) return 0;
      
      return parseFloat((totalRevenue / totalUsers).toFixed(2));
    } catch (error) {
      console.error('Error calculating ARPU:', error);
      return 0;
    }
  }

  async calculateConversionRate(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          conversionEvents: { 
            $sum: { 
              $cond: [{ 
                $in: ['$type', ['PURCHASE', 'SUBSCRIPTION', 'FORM_SUBMIT']] 
              }, 1, 0] 
            }
          }
        }}
      ]);
      
      const data = result[0];
      if (!data || data.totalEvents === 0) return 0;
      
      return parseFloat(((data.conversionEvents / data.totalEvents) * 100).toFixed(2));
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
      return 0;
    }
  }

  async calculateTotalEngagements(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = { 
        $in: ['LIKE', 'COMMENT', 'SHARE', 'RATING', 'DOWNLOAD'] 
      };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating total engagements:', error);
      return 0;
    }
  }

  async calculateEngagementRate(dateRange, filters) {
    try {
      const totalEngagements = await this.calculateTotalEngagements(dateRange, filters);
      const totalUsers = await this.calculateTotalUsers(dateRange, filters);
      
      if (totalUsers === 0) return 0;
      
      return parseFloat(((totalEngagements / totalUsers) * 100).toFixed(2));
    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      return 0;
    }
  }

  async calculateShares(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'SHARE';
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating shares:', error);
      return 0;
    }
  }

  async calculateComments(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'COMMENT';
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating comments:', error);
      return 0;
    }
  }

  async calculateAverageRating(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'RATING';
      matchStage['properties.rating'] = { $exists: true, $ne: null };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          averageRating: { $avg: '$properties.rating' },
          count: { $sum: 1 }
        }}
      ]);
      
      return parseFloat((result[0]?.averageRating || 0).toFixed(2));
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return 0;
    }
  }

  async calculateSatisfactionScore(dateRange, filters) {
    try {
      // This would typically come from surveys
      // For now, use a combination of engagement metrics
      const engagementRate = await this.calculateEngagementRate(dateRange, filters);
      const averageRating = await this.calculateAverageRating(dateRange, filters);
      
      // Normalize and weight the metrics
      const normalizedEngagement = Math.min(engagementRate / 100, 1);
      const normalizedRating = averageRating / 5;
      
      const satisfactionScore = (normalizedEngagement * 0.6 + normalizedRating * 0.4) * 100;
      
      return parseFloat(satisfactionScore.toFixed(2));
    } catch (error) {
      console.error('Error calculating satisfaction score:', error);
      return 0;
    }
  }

  async calculateNetPromoterScore(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'RATING';
      matchStage['properties.nps'] = { $exists: true, $ne: null };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $bucket: {
          groupBy: '$properties.nps',
          boundaries: [0, 7, 9, 11], // 0-6: Detractors, 7-8: Passive, 9-10: Promoters
          default: 'other',
          output: {
            count: { $sum: 1 },
            detractors: {
              $sum: { $cond: [{ $lt: ['$properties.nps', 7] }, 1, 0] }
            },
            passives: {
              $sum: { $cond: [{ $and: [
                { $gte: ['$properties.nps', 7] },
                { $lt: ['$properties.nps', 9] }
              ]}, 1, 0] }
            },
            promoters: {
              $sum: { $cond: [{ $gte: ['$properties.nps', 9] }, 1, 0] }
            }
          }
        }}
      ]);
      
      const data = result[0];
      if (!data || data.count === 0) return 0;
      
      const nps = ((data.promoters - data.detractors) / data.count) * 100;
      return Math.round(nps);
    } catch (error) {
      console.error('Error calculating NPS:', error);
      return 0;
    }
  }

  async calculateGrowthRate(dateRange, filters) {
    try {
      // Calculate growth from previous period
      const previousPeriod = this.getPreviousPeriod(dateRange);
      const previousUsers = await this.calculateTotalUsers(previousPeriod, filters);
      const currentUsers = await this.calculateTotalUsers(dateRange, filters);
      
      if (previousUsers === 0) return currentUsers > 0 ? 100 : 0;
      
      const growthRate = ((currentUsers - previousUsers) / previousUsers) * 100;
      return parseFloat(growthRate.toFixed(2));
    } catch (error) {
      console.error('Error calculating growth rate:', error);
      return 0;
    }
  }

  async calculateChurnRate(dateRange, filters) {
    try {
      // Simplified churn calculation
      // In production, this would be more sophisticated
      const previousPeriod = this.getPreviousPeriod(dateRange);
      const previousUsers = await this.calculateTotalUsers(previousPeriod, filters);
      const currentUsers = await this.calculateTotalUsers(dateRange, filters);
      
      if (previousUsers === 0) return 0;
      
      // Users who were active in previous period but not in current period
      const matchPrevious = this.buildMatchStage(previousPeriod, filters);
      matchPrevious.userId = { $ne: null };
      
      const previousActiveUsers = await Event.aggregate([
        { $match: matchPrevious },
        { $group: { _id: '$userId' } }
      ]);
      
      const previousUserIds = previousActiveUsers.map(user => user._id);
      
      const matchCurrent = this.buildMatchStage(dateRange, filters);
      matchCurrent.userId = { $ne: null, $in: previousUserIds };
      
      const currentActiveFromPrevious = await Event.aggregate([
        { $match: matchCurrent },
        { $group: { _id: '$userId' } },
        { $count: 'total' }
      ]);
      
      const retainedUsers = currentActiveFromPrevious[0]?.total || 0;
      const churnedUsers = previousUserIds.length - retainedUsers;
      
      const churnRate = (churnedUsers / previousUserIds.length) * 100;
      return parseFloat(churnRate.toFixed(2));
    } catch (error) {
      console.error('Error calculating churn rate:', error);
      return 0;
    }
  }

  async calculateViralCoefficient(dateRange, filters) {
    try {
      // Simplified viral coefficient calculation
      // In production, this would track actual referrals
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage.type = 'SHARE';
      matchStage['properties.referrals'] = { $exists: true, $gt: 0 };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalShares: { $sum: 1 },
          totalReferrals: { $sum: '$properties.referrals' }
        }}
      ]);
      
      const data = result[0];
      if (!data || data.totalShares === 0) return 0;
      
      const viralCoefficient = data.totalReferrals / data.totalShares;
      return parseFloat(viralCoefficient.toFixed(2));
    } catch (error) {
      console.error('Error calculating viral coefficient:', error);
      return 0;
    }
  }

  async calculateTotalActivity(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating total activity:', error);
      return 0;
    }
  }

  async calculateEngagementScore(dateRange, filters) {
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          totalScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$type', 'PAGE_VIEW'] }, then: 1 },
                  { case: { $eq: ['$type', 'BUTTON_CLICK'] }, then: 2 },
                  { case: { $eq: ['$type', 'FORM_SUBMIT'] }, then: 5 },
                  { case: { $eq: ['$type', 'LIKE'] }, then: 3 },
                  { case: { $eq: ['$type', 'COMMENT'] }, then: 4 },
                  { case: { $eq: ['$type', 'SHARE'] }, then: 5 },
                  { case: { $eq: ['$type', 'PURCHASE'] }, then: 10 },
                  { case: { $eq: ['$type', 'SUBSCRIPTION'] }, then: 15 }
                ],
                default: 0
              }
            }
          }
        }}
      ]);
      
      return result[0]?.totalScore || 0;
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  async calculateRetentionRate(dateRange, filters) {
    try {
      // Simplified retention rate calculation
      const previousPeriod = this.getPreviousPeriod(dateRange);
      const previousUsers = await this.calculateTotalUsers(previousPeriod, filters);
      const currentUsersFromPrevious = await this.calculateReturningUsers(dateRange, filters);
      
      if (previousUsers === 0) return 0;
      
      const retentionRate = (currentUsersFromPrevious / previousUsers) * 100;
      return parseFloat(retentionRate.toFixed(2));
    } catch (error) {
      console.error('Error calculating retention rate:', error);
      return 0;
    }
  }

  async calculatePerformanceScore(dateRange, filters) {
    try {
      // Combine multiple performance metrics
      const [
        averageSessionDuration,
        pagesPerSession,
        bounceRate
      ] = await Promise.all([
        this.calculateAverageSessionDuration(dateRange, filters),
        this.calculatePagesPerSession(dateRange, filters),
        this.calculateBounceRate(dateRange, filters)
      ]);
      
      // Normalize metrics (simplified)
      const normalizedDuration = Math.min(averageSessionDuration / 300, 1); // Cap at 5 minutes
      const normalizedPages = Math.min(pagesPerSession / 10, 1); // Cap at 10 pages
      const normalizedBounce = 1 - (bounceRate / 100); // Inverse of bounce rate
      
      const performanceScore = (normalizedDuration * 0.4 + normalizedPages * 0.3 + normalizedBounce * 0.3) * 100;
      return parseFloat(performanceScore.toFixed(2));
    } catch (error) {
      console.error('Error calculating performance score:', error);
      return 0;
    }
  }

  async calculateQualityScore(dateRange, filters) {
    try {
      // Combine quality metrics
      const [
        averageRating,
        satisfactionScore,
        netPromoterScore
      ] = await Promise.all([
        this.calculateAverageRating(dateRange, filters),
        this.calculateSatisfactionScore(dateRange, filters),
        this.calculateNetPromoterScore(dateRange, filters)
      ]);
      
      // Normalize metrics
      const normalizedRating = averageRating / 5;
      const normalizedSatisfaction = satisfactionScore / 100;
      const normalizedNPS = (netPromoterScore + 100) / 200; // Convert from -100..100 to 0..1
      
      const qualityScore = (normalizedRating * 0.4 + normalizedSatisfaction * 0.3 + normalizedNPS * 0.3) * 100;
      return parseFloat(qualityScore.toFixed(2));
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return 0;
    }
  }

  async calculateCustomMetric(metric, dateRange, filters) {
    // For custom metrics, look in event properties
    try {
      const matchStage = this.buildMatchStage(dateRange, filters);
      matchStage[`properties.${metric}`] = { $exists: true, $ne: null };
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: null,
          total: { $sum: `$properties.${metric}` },
          count: { $sum: 1 }
        }}
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error(`Error calculating custom metric ${metric}:`, error);
      return 0;
    }
  }

  // ==========================================
  // REAL-TIME CALCULATIONS
  // ==========================================

  async calculateActiveUsersNow() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const result = await Event.aggregate([
        { $match: {
          timestamp: { $gte: fiveMinutesAgo },
          userId: { $ne: null }
        }},
        { $group: { _id: '$userId' } },
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating active users now:', error);
      return 0;
    }
  }

  async calculateActiveSessionsNow() {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const result = await Session.aggregate([
        { $match: {
          lastActivity: { $gte: fifteenMinutesAgo },
          active: true
        }},
        { $count: 'total' }
      ]);
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating active sessions now:', error);
      return 0;
    }
  }

  async calculateEventsPerSecond() {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      
      const result = await Event.aggregate([
        { $match: { timestamp: { $gte: oneMinuteAgo } } },
        { $count: 'total' }
      ]);
      
      const eventsPerMinute = result[0]?.total || 0;
      return parseFloat((eventsPerMinute / 60).toFixed(2));
    } catch (error) {
      console.error('Error calculating events per second:', error);
      return 0;
    }
  }

  async getActiveAlertsNow() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      return await mongoose.model('Alert').find({
        acknowledged: false,
        enabled: true,
        timestamp: { $gte: oneHourAgo },
        severity: { $in: ['HIGH', 'CRITICAL'] }
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
    } catch (error) {
      console.error('Error getting active alerts now:', error);
      return [];
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  async getPreviousMetricValue(metric, query) {
    try {
      const previousDateRange = this.getPreviousPeriod(
        this.calculateDateRange(query.period, query.startDate, query.endDate)
      );
      
      const previousQuery = {
        ...query,
        startDate: previousDateRange.startDate,
        endDate: previousDateRange.endDate
      };
      
      return await this.calculateMetric(metric, previousQuery);
    } catch (error) {
      console.error('Error getting previous metric value:', error);
      return null;
    }
  }

  determineTrend(change, changePercentage) {
    if (Math.abs(changePercentage) < 5) return 'FLAT';
    if (change > 0) return 'UP';
    if (change < 0) return 'DOWN';
    
    // Check for volatility (simplified)
    return Math.random() > 0.7 ? 'VOLATILE' : 'FLAT';
  }

  async getMetricBreakdown(metric, query) {
    try {
      const dateRange = this.calculateDateRange(query.period, query.startDate, query.endDate);
      const matchStage = this.buildMatchStage(dateRange, query.filters);
      
      let groupByField;
      switch (metric) {
        case 'USERS':
          groupByField = '$userId';
          break;
        case 'ACTIVITY':
          groupByField = '$type';
          break;
        case 'REVENUE':
          groupByField = '$properties.source';
          break;
        default:
          return [];
      }
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: groupByField,
          count: { $sum: 1 },
          value: { 
            $sum: metric === 'REVENUE' ? '$properties.amount' : 1 
          }
        }},
        { $sort: { value: -1 } },
        { $limit: 10 }
      ]);
      
      const total = result.reduce((sum, item) => sum + item.value, 0);
      
      return result.map(item => ({
        dimension: metric === 'USERS' ? 'user' : 
                  metric === 'ACTIVITY' ? 'event_type' : 'source',
        value: item._id?.toString() || 'Unknown',
        count: item.count,
        percentage: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(2)) : 0,
        change: null
      }));
    } catch (error) {
      console.error('Error getting metric breakdown:', error);
      return [];
    }
  }

  async getMetricTimeline(metric, query) {
    try {
      const dateRange = this.calculateDateRange(query.period, query.startDate, query.endDate);
      const matchStage = this.buildMatchStage(dateRange, query.filters);
      
      let groupByFormat;
      switch (query.groupBy || 'DAY') {
        case 'HOUR':
          groupByFormat = { hour: { $hour: '$timestamp' } };
          break;
        case 'WEEK':
          groupByFormat = { week: { $week: '$timestamp' } };
          break;
        case 'MONTH':
          groupByFormat = { month: { $month: '$timestamp' } };
          break;
        default: // DAY
          groupByFormat = { day: { $dayOfMonth: '$timestamp' } };
      }
      
      const result = await Event.aggregate([
        { $match: matchStage },
        { $group: {
          _id: {
            ...groupByFormat,
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          value: { 
            $sum: metric === 'REVENUE' ? '$properties.amount' : 1 
          }
        }},
        { $sort: { '_id.date': 1 } }
      ]);
      
      return result.map(item => ({
        timestamp: new Date(item._id.date),
        value: item.value,
        label: this.getTimelineLabel(item._id, query.groupBy)
      }));
    } catch (error) {
      console.error('Error getting metric timeline:', error);
      return [];
    }
  }

  getTimelineLabel(id, groupBy) {
    switch (groupBy) {
      case 'HOUR':
        return `Hour ${id.hour}`;
      case 'WEEK':
        return `Week ${id.week}`;
      case 'MONTH':
        return `Month ${id.month}`;
      default:
        return `Day ${id.day}`;
    }
  }

  async getMetricTarget(metric, query) {
    // In production, this would come from a targets/goals database
    // For now, use static targets
    const targets = {
      USERS: 1000,
      REVENUE: 10000,
      CONVERSION_RATE: 5,
      ENGAGEMENT: 75,
      RETENTION: 70
    };
    
    const target = targets[metric] || 0;
    const achieved = await this.calculateMetric(metric, query);
    const progress = target > 0 ? (achieved / target) * 100 : 0;
    
    return {
      target,
      achieved,
      progress: parseFloat(progress.toFixed(2))
    };
  }

  getMetricDisplayName(metric) {
    const names = {
      USERS: 'Total Users',
      ACTIVITY: 'Total Activity',
      REVENUE: 'Total Revenue',
      ENGAGEMENT: 'Engagement Score',
      RETENTION: 'Retention Rate',
      PERFORMANCE: 'Performance Score',
      QUALITY: 'Quality Score',
      GROWTH: 'Growth Rate'
    };
    
    return names[metric] || metric.replace(/_/g, ' ');
  }

  calculateDateRange(period, customStart, customEnd) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'TODAY':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case 'YESTERDAY':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'LAST_7_DAYS':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
        break;
      case 'LAST_30_DAYS':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date();
        break;
      case 'THIS_MONTH':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case 'LAST_MONTH':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'CUSTOM':
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;
      case 'ALL_TIME':
        startDate = new Date(0);
        endDate = new Date();
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
    }
    
    return { startDate, endDate };
  }

  getPreviousPeriod(dateRange) {
    const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    return {
      startDate: new Date(dateRange.startDate.getTime() - duration),
      endDate: new Date(dateRange.endDate.getTime() - duration)
    };
  }

  buildMatchStage(dateRange, filters) {
    const matchStage = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };
    
    if (filters) {
      this.applyFiltersToMatchStage(matchStage, filters);
    }
    
    return matchStage;
  }

  applyFiltersToMatchStage(matchStage, filters) {
    filters?.forEach(filter => {
      const { field, operator, value } = filter;
      
      switch (operator) {
        case 'EQUALS':
          matchStage[field] = value;
          break;
        case 'NOT_EQUALS':
          matchStage[field] = { $ne: value };
          break;
        case 'GREATER_THAN':
          matchStage[field] = { $gt: value };
          break;
        case 'LESS_THAN':
          matchStage[field] = { $lt: value };
          break;
        case 'GREATER_THAN_EQUALS':
          matchStage[field] = { $gte: value };
          break;
        case 'LESS_THAN_EQUALS':
          matchStage[field] = { $lte: value };
          break;
        case 'CONTAINS':
          matchStage[field] = { $regex: value, $options: 'i' };
          break;
        case 'NOT_CONTAINS':
          matchStage[field] = { $not: { $regex: value, $options: 'i' } };
          break;
        case 'STARTS_WITH':
          matchStage[field] = { $regex: `^${value}`, $options: 'i' };
          break;
        case 'ENDS_WITH':
          matchStage[field] = { $regex: `${value}$`, $options: 'i' };
          break;
        case 'IN':
          matchStage[field] = { $in: value };
          break;
        case 'NOT_IN':
          matchStage[field] = { $nin: value };
          break;
        case 'BETWEEN':
          matchStage[field] = { $gte: value[0], $lte: value[1] };
          break;
      }
    });
  }

  generateQueryHash(query) {
    const queryString = JSON.stringify(query);
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(queryString)
      .digest('hex');
  }

  async getFromCache(key) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  async setCache(key, data, ttl) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // ==========================================
  // RECALCULATION
  // ==========================================

  async recalculateMetrics(metric, startDate, endDate) {
    try {
      console.log(`Starting recalculation of ${metric} from ${startDate} to ${endDate}`);
      
      // In production, this would:
      // 1. Clear existing metric snapshots for the period
      // 2. Recalculate from raw event data
      // 3. Store new snapshots
      // 4. Update aggregate tables
      
      // For now, simulate the process
      const date = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = endDate ? new Date(endDate) : new Date();
      
      let currentDate = new Date(date);
      const snapshots = [];
      
      while (currentDate <= toDate) {
        // Create daily snapshots
        const snapshotDate = new Date(currentDate);
        snapshotDate.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(snapshotDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Calculate metric for the day
        const query = {
          period: 'CUSTOM',
          startDate: snapshotDate,
          endDate: nextDate
        };
        
        const value = await this.calculateMetric(metric, query);
        
        // Create snapshot
        const snapshot = new MetricSnapshot({
          metric,
          period: 'DAILY',
          date: snapshotDate,
          value,
          previousValue: null, // Would be calculated from previous snapshot
          change: null,
          changePercentage: null,
          breakdown: [],
          trend: 'FLAT'
        });
        
        snapshots.push(snapshot);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Save snapshots in bulk
      if (snapshots.length > 0) {
        await MetricSnapshot.insertMany(snapshots);
      }
      
      // Clear cache for this metric
      const pattern = `metric:${metric}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      console.log(`Recalculation completed: ${snapshots.length} snapshots created`);
      
      return {
        success: true,
        message: `Recalculated ${metric} with ${snapshots.length} snapshots`,
        snapshotsCreated: snapshots.length,
        startDate: date,
        endDate: toDate
      };
    } catch (error) {
      console.error('Error recalculating metrics:', error);
      throw new Error(`Failed to recalculate metrics: ${error.message}`);
    }
  }
}

export default new MetricsService();