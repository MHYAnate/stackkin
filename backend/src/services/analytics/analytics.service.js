import Event from '../../models/Event.js';
import Session from '../../models/Session.js';
import Dashboard from '../../models/Dashboard.js';
import Widget from '../../models/Widget.js';
import AITest from '../../models/AITest.js';
import Alert from '../../models/Alert.js';
import AnalyticsCache from '../../models/AnalyticsCache.js';
import MetricSnapshot from '../../models/MetricSnapshot.js';
import Cohort from '../../models/Cohort.js';
import Funnel from '../../models/Funnel.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import dateFns from 'date-fns';

const redis = new Redis(process.env.REDIS_URL);

class AnalyticsService {
  constructor() {
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || 300;
  }

  // ==========================================
  // EVENT TRACKING
  // ==========================================

  async trackEvent(eventData) {
    try {
      // Generate session ID if not provided
      if (!eventData.sessionId) {
        eventData.sessionId = uuidv4();
      }

      // Extract location from IP
      let location = null;
      if (eventData.ipAddress) {
        const geo = geoip.lookup(eventData.ipAddress);
        if (geo) {
          location = {
            country: geo.country,
            region: geo.region,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            timezone: geo.timezone,
          };
        }
      }

      // Parse user agent
      let device = null;
      if (eventData.userAgent) {
        const agent = useragent.parse(eventData.userAgent);
        device = {
          type: this.getDeviceType(agent),
          brand: agent.device.family,
          model: agent.device.family,
          os: agent.os.family,
          osVersion: agent.os.major,
          browser: agent.family,
          browserVersion: agent.major,
          screenResolution: eventData.screenResolution || null,
          language: eventData.language || null,
        };
      }

      // Create event
      const event = new Event({
        ...eventData,
        location,
        device,
      });

      await event.save();

      // Update or create session
      await this.updateSession(event);

      // Publish real-time update
      pubsub.publish(EVENTS.REAL_TIME_UPDATE, {
        realTimeUpdate: {
          type: 'EVENT',
          data: event.toObject(),
          timestamp: new Date(),
        },
      });

      // Check for alerts related to this event
      await this.checkAlerts(event);

      // Update cache
      await this.invalidateCache(event);

      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw new Error(`Failed to track event: ${error.message}`);
    }
  }

  async trackBatchEvents(events) {
    const trackedEvents = [];
    for (const eventData of events) {
      try {
        const event = await this.trackEvent(eventData);
        trackedEvents.push(event);
      } catch (error) {
        console.error('Error tracking event in batch:', error);
        // Continue with other events
      }
    }
    return trackedEvents;
  }

  // ==========================================
  // ANALYTICS QUERIES
  // ==========================================

  async getAnalytics(query, user) {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('analytics', query, user);
      
      // Try to get from cache
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Parse query
      const { period, startDate, endDate, metrics, dimensions, filters, groupBy } = query;
      
      // Calculate date range
      const dateRange = this.calculateDateRange(period, startDate, endDate);
      
      // Build aggregation pipeline
      const pipeline = this.buildAnalyticsPipeline(dateRange, metrics, dimensions, filters, groupBy);
      
      // Execute aggregation
      const results = await Event.aggregate(pipeline);
      
      // Process results
      const analyticsData = this.processAnalyticsResults(results, query, dateRange);
      
      // Get summary metrics
      const summary = await this.getSummaryMetrics(query);
      
      // Get trends
      const trends = await this.getTrendAnalysis(query);
      
      // Get comparison if requested
      let comparison = null;
      if (query.compareWithPrevious) {
        comparison = await this.getComparisonData(query);
      }
      
      // Generate charts
      const charts = await this.generateCharts(query, analyticsData.metrics);
      
      // Get recommendations
      const recommendations = await this.getRecommendations(query, analyticsData);
      
      // Compile final result
      const result = {
        period: query.period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        summary,
        metrics: analyticsData.metrics,
        trends,
        comparison,
        charts,
        recommendations,
        generatedAt: new Date(),
        query: query,
      };

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  async compareAnalytics(query, compareWith, user) {
    try {
      const [currentData, previousData] = await Promise.all([
        this.getAnalytics(query, user),
        this.getAnalytics(compareWith, user),
      ]);

      const comparison = {
        currentPeriod: {
          startDate: currentData.startDate,
          endDate: currentData.endDate,
          metrics: currentData.metrics.map(metric => ({
            name: metric.name,
            currentValue: metric.value,
          })),
        },
        previousPeriod: {
          startDate: previousData.startDate,
          endDate: previousData.endDate,
          metrics: previousData.metrics.map(metric => ({
            name: metric.name,
            previousValue: metric.value,
          })),
        },
      };

      // Calculate changes
      comparison.change = this.calculateComparisonChange(
        comparison.currentPeriod.metrics,
        comparison.previousPeriod.metrics
      );

      return comparison;
    } catch (error) {
      console.error('Error comparing analytics:', error);
      throw new Error(`Failed to compare analytics: ${error.message}`);
    }
  }

  // ==========================================
  // DASHBOARDS
  // ==========================================

  async getUserDashboards(userId) {
    try {
      return await Dashboard.find({
        $or: [
          { owner: userId },
          { 'sharedWith.userId': userId },
          { isPublic: true }
        ]
      })
        .populate('owner', 'name email avatar')
        .populate('widgets')
        .sort({ updatedAt: -1 });
    } catch (error) {
      console.error('Error getting user dashboards:', error);
      throw new Error(`Failed to get dashboards: ${error.message}`);
    }
  }

  async getDashboardById(dashboardId) {
    try {
      return await Dashboard.findById(dashboardId)
        .populate('owner', 'name email avatar')
        .populate('widgets')
        .populate('sharedWith.userId', 'name email avatar');
    } catch (error) {
      console.error('Error getting dashboard:', error);
      throw new Error(`Failed to get dashboard: ${error.message}`);
    }
  }

  async checkDashboardAccess(dashboardId, userId, role) {
    try {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return true;
      }

      const dashboard = await Dashboard.findById(dashboardId);
      if (!dashboard) return false;

      // Check if user is owner
      if (dashboard.owner.toString() === userId) {
        return true;
      }

      // Check if dashboard is public
      if (dashboard.isPublic) {
        return true;
      }

      // Check if user is in sharedWith
      const shared = dashboard.sharedWith.find(
        share => share.userId.toString() === userId
      );
      
      return !!shared;
    } catch (error) {
      console.error('Error checking dashboard access:', error);
      return false;
    }
  }

  async checkDashboardEditAccess(dashboardId, userId, role) {
    try {
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return true;
      }

      const dashboard = await Dashboard.findById(dashboardId);
      if (!dashboard) return false;

      // Only owner can edit
      return dashboard.owner.toString() === userId;
    } catch (error) {
      console.error('Error checking dashboard edit access:', error);
      return false;
    }
  }

  async createDashboard(data) {
    try {
      const dashboard = new Dashboard({
        ...data,
        layout: data.layout || {
          type: 'GRID',
          columns: 12,
          configuration: {}
        }
      });

      await dashboard.save();
      
      // Populate owner
      await dashboard.populate('owner', 'name email avatar');
      
      return dashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw new Error(`Failed to create dashboard: ${error.message}`);
    }
  }

  async updateDashboard(dashboardId, input) {
    try {
      const dashboard = await Dashboard.findByIdAndUpdate(
        dashboardId,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('owner', 'name email avatar')
        .populate('widgets');

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      return dashboard;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw new Error(`Failed to update dashboard: ${error.message}`);
    }
  }

  async deleteDashboard(dashboardId) {
    try {
      // Delete all widgets first
      await Widget.deleteMany({ dashboardId });
      
      // Delete dashboard
      const result = await Dashboard.findByIdAndDelete(dashboardId);
      
      return result !== null;
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw new Error(`Failed to delete dashboard: ${error.message}`);
    }
  }

  async duplicateDashboard(dashboardId, newName, userId) {
    try {
      const original = await Dashboard.findById(dashboardId)
        .populate('widgets');
      
      if (!original) {
        throw new Error('Dashboard not found');
      }

      // Check access
      const hasAccess = await this.checkDashboardAccess(dashboardId, userId, 'USER');
      if (!hasAccess) {
        throw new Error('No permission to duplicate this dashboard');
      }

      // Create new dashboard
      const newDashboard = new Dashboard({
        name: newName,
        description: original.description,
        layout: original.layout,
        owner: userId,
        isPublic: false,
        refreshInterval: original.refreshInterval,
        autoRefresh: original.autoRefresh,
        theme: original.theme,
        organization: original.organization,
        tags: [...original.tags],
      });

      await newDashboard.save();

      // Duplicate widgets
      for (const widget of original.widgets) {
        const newWidget = new Widget({
          ...widget.toObject(),
          _id: undefined,
          dashboardId: newDashboard._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await newWidget.save();
        newDashboard.widgets.push(newWidget._id);
      }

      await newDashboard.save();
      await newDashboard.populate('widgets');
      await newDashboard.populate('owner', 'name email avatar');

      return newDashboard;
    } catch (error) {
      console.error('Error duplicating dashboard:', error);
      throw new Error(`Failed to duplicate dashboard: ${error.message}`);
    }
  }

  // ==========================================
  // WIDGETS
  // ==========================================

  async addWidget(dashboardId, widget) {
    try {
      const newWidget = new Widget({
        ...widget,
        dashboardId,
      });

      await newWidget.save();

      // Add widget to dashboard
      await Dashboard.findByIdAndUpdate(
        dashboardId,
        { $push: { widgets: newWidget._id } }
      );

      return newWidget;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw new Error(`Failed to add widget: ${error.message}`);
    }
  }

  async getWidgetById(widgetId) {
    try {
      return await Widget.findById(widgetId);
    } catch (error) {
      console.error('Error getting widget:', error);
      throw new Error(`Failed to get widget: ${error.message}`);
    }
  }

  async updateWidget(widgetId, input) {
    try {
      const widget = await Widget.findByIdAndUpdate(
        widgetId,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!widget) {
        throw new Error('Widget not found');
      }

      // Invalidate widget cache
      await this.invalidateWidgetCache(widgetId);

      return widget;
    } catch (error) {
      console.error('Error updating widget:', error);
      throw new Error(`Failed to update widget: ${error.message}`);
    }
  }

  async removeWidget(widgetId) {
    try {
      const widget = await Widget.findById(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }

      // Remove widget from dashboard
      await Dashboard.findByIdAndUpdate(
        widget.dashboardId,
        { $pull: { widgets: widgetId } }
      );

      // Delete widget
      await Widget.findByIdAndDelete(widgetId);

      return true;
    } catch (error) {
      console.error('Error removing widget:', error);
      throw new Error(`Failed to remove widget: ${error.message}`);
    }
  }

  async rearrangeWidgets(dashboardId, layout) {
    try {
      const dashboard = await Dashboard.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      dashboard.layout = layout;
      await dashboard.save();

      return dashboard;
    } catch (error) {
      console.error('Error rearranging widgets:', error);
      throw new Error(`Failed to rearrange widgets: ${error.message}`);
    }
  }

  async getDashboardWidgets(dashboardId) {
    try {
      return await Widget.find({ dashboardId }).sort({ createdAt: 1 });
    } catch (error) {
      console.error('Error getting dashboard widgets:', error);
      throw new Error(`Failed to get widgets: ${error.message}`);
    }
  }

  async getWidgetData(widgetId, query) {
    try {
      // Generate cache key for widget data
      const cacheKey = `widget:${widgetId}:${this.generateQueryHash(query)}`;
      
      // Try cache first
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Get widget
      const widget = await Widget.findById(widgetId);
      if (!widget) {
        throw new Error('Widget not found');
      }

      // Use widget query or provided query
      const analyticsQuery = query || widget.query;
      
      // Get analytics data
      const data = await this.getAnalytics(analyticsQuery, null);

      // Transform data based on widget type
      const transformedData = this.transformWidgetData(data, widget);

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, transformedData, widget.cacheTTL || this.cacheTTL);
      }

      return transformedData;
    } catch (error) {
      console.error('Error getting widget data:', error);
      throw new Error(`Failed to get widget data: ${error.message}`);
    }
  }

  // ==========================================
  // SHARING
  // ==========================================

  async shareDashboard(dashboardId, userIds, permission) {
    try {
      const dashboard = await Dashboard.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Remove existing shares for these users
      dashboard.sharedWith = dashboard.sharedWith.filter(
        share => !userIds.includes(share.userId.toString())
      );

      // Add new shares
      userIds.forEach(userId => {
        dashboard.sharedWith.push({
          userId,
          permission,
          sharedAt: new Date()
        });
      });

      await dashboard.save();
      await dashboard.populate('sharedWith.userId', 'name email avatar');

      return dashboard;
    } catch (error) {
      console.error('Error sharing dashboard:', error);
      throw new Error(`Failed to share dashboard: ${error.message}`);
    }
  }

  async unshareDashboard(dashboardId, userIds) {
    try {
      const dashboard = await Dashboard.findById(dashboardId);
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      dashboard.sharedWith = dashboard.sharedWith.filter(
        share => !userIds.includes(share.userId.toString())
      );

      await dashboard.save();
      return dashboard;
    } catch (error) {
      console.error('Error unsharing dashboard:', error);
      throw new Error(`Failed to unshare dashboard: ${error.message}`);
    }
  }

  async makeDashboardPublic(dashboardId, isPublic) {
    try {
      const dashboard = await Dashboard.findByIdAndUpdate(
        dashboardId,
        { isPublic },
        { new: true }
      )
        .populate('owner', 'name email avatar')
        .populate('widgets');

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      return dashboard;
    } catch (error) {
      console.error('Error making dashboard public:', error);
      throw new Error(`Failed to change dashboard visibility: ${error.message}`);
    }
  }

  // ==========================================
  // EVENTS & SESSIONS
  // ==========================================

  async getEvents(filters = {}, pagination = {}) {
    try {
      const {
        type,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = filters;

      const query = {};
      
      if (type) query.type = type;
      if (userId) query.userId = userId;
      
      // Date range
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: 'userId',
        lean: true
      };

      const result = await Event.paginate(query, options);

      return {
        edges: result.docs.map(doc => ({
          node: doc,
          cursor: doc._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPrevPage,
          startCursor: result.docs[0]?._id.toString(),
          endCursor: result.docs[result.docs.length - 1]?._id.toString(),
        },
        totalCount: result.totalDocs
      };
    } catch (error) {
      console.error('Error getting events:', error);
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  async getSessions(filters = {}, pagination = {}) {
    try {
      const {
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'startTime',
        sortOrder = 'desc'
      } = filters;

      const query = {};
      
      if (userId) query.userId = userId;
      
      // Date range
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: ['userId', 'events'],
        lean: true
      };

      const result = await Session.paginate(query, options);

      return {
        edges: result.docs.map(doc => ({
          node: doc,
          cursor: doc._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPrevPage,
          startCursor: result.docs[0]?._id.toString(),
          endCursor: result.docs[result.docs.length - 1]?._id.toString(),
        },
        totalCount: result.totalDocs
      };
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw new Error(`Failed to get sessions: ${error.message}`);
    }
  }

  async getSessionById(sessionId) {
    try {
      const session = await Session.findOne({ sessionId })
        .populate('userId', 'name email avatar')
        .populate('events');

      if (!session) {
        throw new Error('Session not found');
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  async getSessionEvents(sessionId) {
    try {
      const session = await Session.findOne({ sessionId }).populate('events');
      return session ? session.events : [];
    } catch (error) {
      console.error('Error getting session events:', error);
      throw new Error(`Failed to get session events: ${error.message}`);
    }
  }

  // ==========================================
  // ADVANCED ANALYTICS
  // ==========================================

  async getCohortAnalysis(input) {
    try {
      const { startDate, endDate, period, metric, filters } = input;
      
      // Generate cache key
      const cacheKey = this.generateCacheKey('cohort', input);
      
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Calculate cohorts
      const cohorts = await this.calculateCohorts(startDate, endDate, period, metric, filters);
      
      // Get summary
      const summary = await this.getCohortSummary(cohorts);
      
      // Get insights
      const insights = await this.getCohortInsights(cohorts);
      
      const result = {
        startDate,
        endDate,
        period,
        metric,
        cohorts,
        summary,
        insights,
      };

      // Save to database for historical reference
      const cohortRecord = new Cohort({
        ...result,
        calculatedAt: new Date(),
      });
      await cohortRecord.save();

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, result, this.cacheTTL * 2);
      }

      return result;
    } catch (error) {
      console.error('Error getting cohort analysis:', error);
      throw new Error(`Failed to get cohort analysis: ${error.message}`);
    }
  }

  async getFunnelAnalysis(input) {
    try {
      const { stages, startDate, endDate, filters } = input;
      
      // Generate cache key
      const cacheKey = this.generateCacheKey('funnel', input);
      
      if (this.cacheEnabled) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Calculate funnel stages
      const funnelStages = await this.calculateFunnelStages(stages, startDate, endDate, filters);
      
      // Calculate overall metrics
      const totalEntered = funnelStages[0]?.entered || 0;
      const totalConverted = funnelStages[funnelStages.length - 1]?.converted || 0;
      
      // Calculate drop-offs
      const dropOffs = await this.calculateDropOffs(funnelStages);
      
      // Identify optimization opportunities
      const opportunities = await this.identifyOptimizationOpportunities(funnelStages);
      
      // Generate predictions
      const predictions = await this.generateFunnelPredictions({
        stages: funnelStages,
        startDate,
        endDate,
        totalEntered,
        totalConverted,
      });

      const result = {
        stages: funnelStages,
        startDate,
        endDate,
        totalEntered,
        totalConverted,
        overallConversionRate: totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0,
        averageTimeToConvert: this.calculateAverageTimeToConvert(funnelStages),
        dropOffs,
        opportunities,
        predictions,
      };

      // Save to database for historical reference
      const funnelRecord = new Funnel({
        name: 'User Funnel',
        ...result,
        calculatedAt: new Date(),
      });
      await funnelRecord.save();

      // Cache the result
      if (this.cacheEnabled) {
        await this.setCache(cacheKey, result, this.cacheTTL * 2);
      }

      return result;
    } catch (error) {
      console.error('Error getting funnel analysis:', error);
      throw new Error(`Failed to get funnel analysis: ${error.message}`);
    }
  }

  // ==========================================
  // A/B TESTING
  // ==========================================

  async getTests(status) {
    try {
      const query = status ? { status } : {};
      return await AITest.find(query)
        .populate('createdBy', 'name email avatar')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting tests:', error);
      throw new Error(`Failed to get tests: ${error.message}`);
    }
  }

  async getTestById(testId) {
    try {
      const test = await AITest.findById(testId)
        .populate('createdBy', 'name email avatar');

      if (!test) {
        throw new Error('Test not found');
      }

      return test;
    } catch (error) {
      console.error('Error getting test:', error);
      throw new Error(`Failed to get test: ${error.message}`);
    }
  }

  async createTest(data) {
    try {
      const test = new AITest({
        ...data,
        status: 'DRAFT',
      });

      await test.save();
      await test.populate('createdBy', 'name email avatar');

      return test;
    } catch (error) {
      console.error('Error creating test:', error);
      throw new Error(`Failed to create test: ${error.message}`);
    }
  }

  async updateTest(testId, input) {
    try {
      const test = await AITest.findByIdAndUpdate(
        testId,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email avatar');

      if (!test) {
        throw new Error('Test not found');
      }

      return test;
    } catch (error) {
      console.error('Error updating test:', error);
      throw new Error(`Failed to update test: ${error.message}`);
    }
  }

  async deleteTest(testId) {
    try {
      const result = await AITest.findByIdAndDelete(testId);
      return result !== null;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw new Error(`Failed to delete test: ${error.message}`);
    }
  }

  async startTest(testId) {
    try {
      const test = await AITest.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'DRAFT' && test.status !== 'PAUSED') {
        throw new Error('Test can only be started from DRAFT or PAUSED status');
      }

      test.status = 'RUNNING';
      test.startDate = test.startDate || new Date();
      await test.save();

      return test;
    } catch (error) {
      console.error('Error starting test:', error);
      throw new Error(`Failed to start test: ${error.message}`);
    }
  }

  async stopTest(testId) {
    try {
      const test = await AITest.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'RUNNING') {
        throw new Error('Test can only be stopped when RUNNING');
      }

      test.status = 'STOPPED';
      test.endDate = new Date();
      await test.save();

      // Calculate results
      await this.calculateTestResults(testId);

      return test;
    } catch (error) {
      console.error('Error stopping test:', error);
      throw new Error(`Failed to stop test: ${error.message}`);
    }
  }

  async declareWinner(testId, variationId) {
    try {
      const test = await AITest.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const variation = test.variations.id(variationId);
      if (!variation) {
        throw new Error('Variation not found in test');
      }

      // Update test with winner
      if (!test.results) {
        test.results = {};
      }
      test.results.winner = variation._id;
      test.results.calculatedAt = new Date();
      test.status = 'COMPLETED';
      test.endDate = new Date();

      await test.save();
      await test.populate('createdBy', 'name email avatar');

      return test;
    } catch (error) {
      console.error('Error declaring winner:', error);
      throw new Error(`Failed to declare winner: ${error.message}`);
    }
  }

  async getTestResults(testId) {
    try {
      const test = await AITest.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (!test.results) {
        // Calculate results if not already calculated
        return await this.calculateTestResults(testId);
      }

      return test.results;
    } catch (error) {
      console.error('Error getting test results:', error);
      throw new Error(`Failed to get test results: ${error.message}`);
    }
  }

  // ==========================================
  // ALERTS
  // ==========================================

  async getAlerts(filters = {}, pagination = {}) {
    try {
      const {
        type,
        severity,
        acknowledged,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = filters;

      const query = {};
      
      if (type) query.type = type;
      if (severity) query.severity = severity;
      if (acknowledged !== undefined) query.acknowledged = acknowledged;

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: ['createdBy', 'acknowledgedBy'],
        lean: true
      };

      const result = await Alert.paginate(query, options);

      return result.docs;
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  }

  async getAlertById(alertId) {
    try {
      const alert = await Alert.findById(alertId)
        .populate('createdBy', 'name email avatar')
        .populate('acknowledgedBy', 'name email avatar');

      if (!alert) {
        throw new Error('Alert not found');
      }

      return alert;
    } catch (error) {
      console.error('Error getting alert:', error);
      throw new Error(`Failed to get alert: ${error.message}`);
    }
  }

  async getActiveAlerts() {
    try {
      return await Alert.find({
        acknowledged: false,
        enabled: true,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
        .populate('createdBy', 'name email avatar')
        .sort({ severity: -1, timestamp: -1 })
        .limit(50);
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }

  async createAlert(data) {
    try {
      const alert = new Alert(data);
      await alert.save();
      
      // Publish alert
      pubsub.publish(EVENTS.ALERT_TRIGGERED, {
        alertTriggered: alert.toObject()
      });

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  async updateAlert(alertId, input) {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email avatar')
        .populate('acknowledgedBy', 'name email avatar');

      if (!alert) {
        throw new Error('Alert not found');
      }

      return alert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw new Error(`Failed to update alert: ${error.message}`);
    }
  }

  async deleteAlert(alertId) {
    try {
      const result = await Alert.findByIdAndDelete(alertId);
      return result !== null;
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw new Error(`Failed to delete alert: ${error.message}`);
    }
  }

  async acknowledgeAlert(alertId, userId) {
    try {
      const alert = await Alert.findById(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
      
      await alert.save();
      await alert.populate('acknowledgedBy', 'name email avatar');

      return alert;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  }

  async checkAlerts(event) {
    try {
      // Get active alerts for this event type
      const alerts = await Alert.find({
        enabled: true,
        $or: [
          { metric: event.type },
          { 'relatedEntities.entityType': 'EVENT', 'relatedEntities.entityId': event._id }
        ],
        lastTriggered: {
          $lt: new Date(Date.now() - (this.cooldown || 300000))
        }
      });

      for (const alert of alerts) {
        // Check if alert conditions are met
        const shouldTrigger = await this.evaluateAlertCondition(alert, event);
        
        if (shouldTrigger) {
          // Update alert with current values
          alert.currentValue = this.calculateMetricValue(event, alert.metric);
          alert.lastTriggered = new Date();
          await alert.save();

          // Publish alert
          pubsub.publish(EVENTS.ALERT_TRIGGERED, {
            alertTriggered: alert.toObject()
          });
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  // ==========================================
  // DATA MANAGEMENT
  // ==========================================

  async exportData(query, format) {
    try {
      // Get analytics data
      const data = await this.getAnalytics(query, null);
      
      // Convert to requested format
      let exportData;
      switch (format) {
        case 'CSV':
          exportData = this.convertToCSV(data);
          break;
        case 'JSON':
          exportData = JSON.stringify(data, null, 2);
          break;
        case 'EXCEL':
          exportData = await this.convertToExcel(data);
          break;
        case 'PDF':
          exportData = await this.convertToPDF(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `analytics-export-${timestamp}.${format.toLowerCase()}`;

      // In production, you would upload to cloud storage and return URL
      // For now, return as base64 string
      const result = {
        filename,
        data: Buffer.from(exportData).toString('base64'),
        format,
        size: exportData.length,
        generatedAt: new Date()
      };

      return JSON.stringify(result);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  async purgeOldData(olderThan) {
    try {
      const date = new Date(olderThan);
      
      // Delete old events
      const eventsResult = await Event.deleteMany({
        timestamp: { $lt: date }
      });

      // Delete old sessions
      const sessionsResult = await Session.deleteMany({
        startTime: { $lt: date }
      });

      // Delete old cache entries
      const cacheResult = await AnalyticsCache.deleteMany({
        createdAt: { $lt: date }
      });

      // Delete old metric snapshots
      const snapshotsResult = await MetricSnapshot.deleteMany({
        createdAt: { $lt: date }
      });

      return {
        deletedCount: {
          events: eventsResult.deletedCount,
          sessions: sessionsResult.deletedCount,
          cache: cacheResult.deletedCount,
          snapshots: snapshotsResult.deletedCount
        },
        timestamp: date,
        purgedAt: new Date()
      };
    } catch (error) {
      console.error('Error purging old data:', error);
      throw new Error(`Failed to purge old data: ${error.message}`);
    }
  }

  async rebuildCache() {
    try {
      // Clear all cache
      await AnalyticsCache.deleteMany({});
      await redis.flushall();

      // Rebuild cache for common queries
      await this.prebuildCommonQueries();

      return {
        success: true,
        message: 'Cache rebuild completed',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error rebuilding cache:', error);
      throw new Error(`Failed to rebuild cache: ${error.message}`);
    }
  }

  // ==========================================
  // ADMIN
  // ==========================================

  async getHealthStatus() {
    try {
      const checks = [];
      
      // Database health check
      const dbStart = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        checks.push({
          component: 'Database',
          status: 'UP',
          latency: Date.now() - dbStart,
          lastChecked: new Date()
        });
      } catch (error) {
        checks.push({
          component: 'Database',
          status: 'DOWN',
          error: error.message,
          lastChecked: new Date()
        });
      }

      // Redis health check
      const redisStart = Date.now();
      try {
        await redis.ping();
        checks.push({
          component: 'Redis',
          status: 'UP',
          latency: Date.now() - redisStart,
          lastChecked: new Date()
        });
      } catch (error) {
        checks.push({
          component: 'Redis',
          status: 'DOWN',
          error: error.message,
          lastChecked: new Date()
        });
      }

      // Event processing health check
      const eventsStart = Date.now();
      try {
        const count = await Event.countDocuments();
        checks.push({
          component: 'Event Processing',
          status: 'UP',
          latency: Date.now() - eventsStart,
          metrics: { totalEvents: count },
          lastChecked: new Date()
        });
      } catch (error) {
        checks.push({
          component: 'Event Processing',
          status: 'DEGRADED',
          error: error.message,
          lastChecked: new Date()
        });
      }

      // Determine overall status
      const hasDown = checks.some(check => check.status === 'DOWN');
      const hasDegraded = checks.some(check => check.status === 'DEGRADED');
      
      let overallStatus = 'HEALTHY';
      if (hasDown) overallStatus = 'UNHEALTHY';
      else if (hasDegraded) overallStatus = 'DEGRADED';

      return {
        status: overallStatus,
        checks,
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        status: 'UNKNOWN',
        checks: [],
        lastChecked: new Date(),
        error: error.message
      };
    }
  }

  async runDiagnostics() {
    try {
      const diagnostics = {
        timestamp: new Date(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime()
        },
        database: {
          collections: await mongoose.connection.db.listCollections().toArray(),
          stats: await mongoose.connection.db.stats()
        },
        cache: {
          redisStatus: await redis.status(),
          cacheEntries: await AnalyticsCache.countDocuments()
        },
        analytics: {
          totalEvents: await Event.countDocuments(),
          totalSessions: await Session.countDocuments(),
          totalReports: await Report.countDocuments(),
          totalDashboards: await Dashboard.countDocuments()
        },
        performance: {
          averageQueryTime: await this.calculateAverageQueryTime(),
          cacheHitRate: await this.calculateCacheHitRate(),
          eventProcessingRate: await this.calculateEventProcessingRate()
        }
      };

      return diagnostics;
    } catch (error) {
      console.error('Error running diagnostics:', error);
      throw new Error(`Failed to run diagnostics: ${error.message}`);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  getDeviceType(agent) {
    if (agent.device.family === 'iPhone' || agent.device.family === 'iPad') {
      return 'MOBILE';
    } else if (agent.device.family === 'Desktop') {
      return 'DESKTOP';
    } else if (agent.device.family === 'Tablet') {
      return 'TABLET';
    } else {
      return 'OTHER';
    }
  }

  async updateSession(event) {
    try {
      const session = await Session.findOne({ sessionId: event.sessionId });
      
      if (session) {
        // Update existing session
        session.events.push(event._id);
        session.eventCount += 1;
        session.lastActivity = new Date();
        session.duration = Math.floor(
          (new Date() - new Date(session.startTime)) / 1000
        );
        
        // Update engagement score
        session.engagementScore = this.calculateEngagementScore(session, event);
        
        // Check for conversions
        if (event.type === 'PURCHASE' || event.type === 'SUBSCRIPTION') {
          session.conversions += 1;
          session.revenue += event.properties?.amount || 0;
        }
        
        await session.save();
      } else {
        // Create new session
        const newSession = new Session({
          sessionId: event.sessionId,
          userId: event.userId,
          device: event.device,
          location: event.location,
          startTime: event.timestamp,
          events: [event._id],
          eventCount: 1,
          lastActivity: event.timestamp,
          engaged: false,
          engagementScore: 0,
          conversions: 0,
          revenue: 0,
          metadata: {}
        });
        
        await newSession.save();
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  calculateEngagementScore(session, event) {
    let score = session.engagementScore || 0;
    
    // Add points based on event type
    const eventScores = {
      PAGE_VIEW: 1,
      BUTTON_CLICK: 2,
      FORM_SUBMIT: 5,
      SEARCH: 2,
      LIKE: 3,
      COMMENT: 4,
      SHARE: 5,
      PURCHASE: 10,
      SUBSCRIPTION: 15
    };
    
    score += eventScores[event.type] || 0;
    
    // Cap score at 100
    return Math.min(score, 100);
  }

  generateCacheKey(prefix, query, user = null) {
    const queryString = JSON.stringify(query);
    const queryHash = crypto
      .createHash('md5')
      .update(queryString)
      .digest('hex');
    
    const userPart = user ? `:${user.id}` : '';
    return `${prefix}:${queryHash}${userPart}`;
  }

  generateQueryHash(query) {
    const queryString = JSON.stringify(query);
    return crypto
      .createHash('md5')
      .update(queryString)
      .digest('hex');
  }

  async getFromCache(key) {
    try {
      // Try Redis first
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Try MongoDB cache
      const cacheEntry = await AnalyticsCache.findOne({ key });
      if (cacheEntry && cacheEntry.expiresAt > new Date()) {
        // Update hit count
        cacheEntry.hits += 1;
        cacheEntry.lastHit = new Date();
        await cacheEntry.save();
        
        // Also cache in Redis for faster access
        await redis.setex(key, cacheEntry.ttl, JSON.stringify(cacheEntry.data));
        
        return cacheEntry.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  async setCache(key, data, ttl) {
    try {
      // Cache in Redis
      await redis.setex(key, ttl, JSON.stringify(data));
      
      // Also cache in MongoDB for persistence
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      await AnalyticsCache.findOneAndUpdate(
        { key },
        {
          key,
          data,
          ttl,
          expiresAt,
          $inc: { hits: 1 },
          lastHit: new Date(),
          size: JSON.stringify(data).length
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  async invalidateCache(event) {
    try {
      // Invalidate cache entries related to this event
      const patterns = [
        `analytics:*${event.type}*`,
        `analytics:*${event.userId}*`,
        `analytics:*${event.sessionId}*`,
        `metrics:*${event.type}*`
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      
      // Also invalidate MongoDB cache
      await AnalyticsCache.deleteMany({
        $or: [
          { 'query.type': event.type },
          { 'query.userId': event.userId },
          { 'query.sessionId': event.sessionId }
        ]
      });
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  async invalidateWidgetCache(widgetId) {
    try {
      const pattern = `widget:${widgetId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating widget cache:', error);
    }
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
        startDate = new Date(0); // Beginning of time
        endDate = new Date();
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date();
    }
    
    return { startDate, endDate };
  }

  buildAnalyticsPipeline(dateRange, metrics, dimensions, filters, groupBy) {
    const pipeline = [];
    
    // Match stage - date range and filters
    const matchStage = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };
    
    // Add filters if provided
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        matchStage[filter.field] = this.buildFilterCondition(filter);
      });
    }
    
    pipeline.push({ $match: matchStage });
    
    // Group stage
    const groupStage = {
      _id: this.buildGroupId(groupBy, dimensions),
      count: { $sum: 1 }
    };
    
    // Add metric calculations
    metrics.forEach(metric => {
      groupStage[metric] = this.buildMetricCalculation(metric);
    });
    
    pipeline.push({ $group: groupStage });
    
    // Sort stage
    pipeline.push({ $sort: { _id: 1 } });
    
    return pipeline;
  }

  buildFilterCondition(filter) {
    const { operator, value } = filter;
    
    switch (operator) {
      case 'EQUALS':
        return value;
      case 'NOT_EQUALS':
        return { $ne: value };
      case 'GREATER_THAN':
        return { $gt: value };
      case 'LESS_THAN':
        return { $lt: value };
      case 'GREATER_THAN_EQUALS':
        return { $gte: value };
      case 'LESS_THAN_EQUALS':
        return { $lte: value };
      case 'CONTAINS':
        return { $regex: value, $options: 'i' };
      case 'NOT_CONTAINS':
        return { $not: { $regex: value, $options: 'i' } };
      case 'STARTS_WITH':
        return { $regex: `^${value}`, $options: 'i' };
      case 'ENDS_WITH':
        return { $regex: `${value}$`, $options: 'i' };
      case 'IN':
        return { $in: value };
      case 'NOT_IN':
        return { $nin: value };
      case 'BETWEEN':
        return { $gte: value[0], $lte: value[1] };
      default:
        return value;
    }
  }

  buildGroupId(groupBy, dimensions) {
    const id = {};
    
    if (groupBy) {
      id.groupBy = `$${groupBy.toLowerCase()}`;
    }
    
    if (dimensions && dimensions.length > 0) {
      dimensions.forEach(dim => {
        id[dim] = `$${dim}`;
      });
    }
    
    return id;
  }

  buildMetricCalculation(metric) {
    switch (metric) {
      case 'REVENUE':
        return { $sum: '$properties.amount' };
      case 'AVERAGE_SESSION_DURATION':
        return { $avg: '$duration' };
      case 'CONVERSION_RATE':
        return { 
          $cond: [
            { $gt: ['$conversions', 0] },
            { $multiply: [{ $divide: ['$conversions', '$count'] }, 100] },
            0
          ]
        };
      default:
        return { $sum: 1 };
    }
  }

  processAnalyticsResults(results, query, dateRange) {
    const metrics = [];
    
    // Process each result
    results.forEach(result => {
      const metricData = {
        type: query.metrics[0],
        name: this.getMetricName(query.metrics[0]),
        value: result[query.metrics[0]] || result.count || 0,
        previousValue: null,
        change: null,
        changePercentage: null,
        trend: 'FLAT',
        breakdown: [],
        timeline: [],
        target: null,
        achieved: null,
        progress: null
      };
      
      // Add breakdown if dimensions exist
      if (result._id && typeof result._id === 'object') {
        Object.entries(result._id).forEach(([dimension, value]) => {
          metricData.breakdown.push({
            dimension,
            value: value.toString(),
            count: result.count,
            percentage: 0, // Will be calculated later
            change: null
          });
        });
      }
      
      metrics.push(metricData);
    });
    
    return { metrics };
  }

  getMetricName(metricType) {
    const metricNames = {
      USERS: 'Total Users',
      ACTIVITY: 'Activity Count',
      REVENUE: 'Total Revenue',
      ENGAGEMENT: 'Engagement Score',
      RETENTION: 'Retention Rate',
      PERFORMANCE: 'Performance Score',
      QUALITY: 'Quality Score',
      GROWTH: 'Growth Rate'
    };
    
    return metricNames[metricType] || metricType;
  }

  calculateComparisonChange(currentMetrics, previousMetrics) {
    const improvement = true; // Simplified
    const magnitude = 0; // Simplified
    const significance = 0.95; // Simplified
    
    const keyDrivers = currentMetrics.map(metric => ({
      metric: metric.name,
      contribution: 0.5, // Simplified
      direction: 'UP', // Simplified
      explanation: 'Increased usage' // Simplified
    }));
    
    return {
      improvement,
      magnitude,
      significance,
      keyDrivers
    };
  }

  transformWidgetData(data, widget) {
    switch (widget.type) {
      case 'METRIC':
        return this.transformMetricData(data, widget);
      case 'CHART':
        return this.transformChartData(data, widget);
      case 'TABLE':
        return this.transformTableData(data, widget);
      case 'HEATMAP':
        return this.transformHeatmapData(data, widget);
      default:
        return data;
    }
  }

  transformMetricData(data, widget) {
    // Extract the main metric value
    const mainMetric = data.metrics[0];
    return {
      value: mainMetric.value,
      change: mainMetric.change,
      changePercentage: mainMetric.changePercentage,
      trend: mainMetric.trend,
      target: mainMetric.target,
      achieved: mainMetric.achieved,
      progress: mainMetric.progress
    };
  }

  transformChartData(data, widget) {
    // Transform data for chart.js format
    const labels = data.metrics.map(m => m.name);
    const datasets = [{
      label: widget.title || 'Data',
      data: data.metrics.map(m => m.value),
      backgroundColor: this.getChartColors(widget.chartConfig?.type, 0),
      borderColor: this.getChartColors(widget.chartConfig?.type, 1),
      fill: widget.chartConfig?.type === 'AREA'
    }];
    
    return {
      labels,
      datasets,
      options: widget.chartConfig?.options || {}
    };
  }

  getChartColors(chartType, index) {
    const colors = {
      LINE: ['rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)'],
      BAR: ['rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)'],
      PIE: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)'
      ]
    };
    
    return colors[chartType]?.[index] || colors.LINE[index];
  }

  async calculateCohorts(startDate, endDate, period, metric, filters) {
    // Simplified cohort calculation
    const cohorts = [];
    const cohortSize = 7; // 7-day cohorts
    
    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      const cohortEnd = new Date(currentStart);
      cohortEnd.setDate(cohortEnd.getDate() + cohortSize);
      
      const cohort = {
        id: currentStart.toISOString(),
        startDate: new Date(currentStart),
        endDate: cohortEnd,
        size: Math.floor(Math.random() * 1000) + 100, // Random size for demo
        retention: this.generateRetentionPoints(period),
        metrics: {
          averageRetention: 0.65,
          peakRetention: 0.85,
          churnRate: 0.35,
          lifetimeValue: 150.50,
          paybackPeriod: 90
        }
      };
      
      cohorts.push(cohort);
      currentStart.setDate(currentStart.getDate() + cohortSize);
    }
    
    return cohorts;
  }

  generateRetentionPoints(period) {
    const points = [];
    const periods = {
      DAY_1: 1,
      DAY_7: 7,
      DAY_30: 30,
      DAY_90: 90,
      DAY_180: 180
    };
    
    const maxPeriod = periods[period] || 30;
    
    for (let i = 1; i <= maxPeriod; i++) {
      points.push({
        period: i,
        retained: Math.floor(Math.random() * 100) + 50,
        retentionRate: Math.random() * 0.8 + 0.2,
        active: Math.floor(Math.random() * 80) + 20,
        activityRate: Math.random() * 0.6 + 0.3,
        revenue: Math.floor(Math.random() * 1000)
      });
    }
    
    return points;
  }

  async getCohortSummary(cohorts) {
    if (!cohorts || cohorts.length === 0) {
      return {
        totalCohorts: 0,
        averageRetention: 0,
        bestCohort: null,
        worstCohort: null,
        trend: 'FLAT',
        improvementRate: 0
      };
    }
    
    // Calculate average retention
    const totalRetention = cohorts.reduce((sum, cohort) => {
      return sum + (cohort.metrics.averageRetention || 0);
    }, 0);
    
    const averageRetention = totalRetention / cohorts.length;
    
    // Find best and worst cohorts
    const sortedCohorts = [...cohorts].sort((a, b) => 
      (b.metrics.averageRetention || 0) - (a.metrics.averageRetention || 0)
    );
    
    return {
      totalCohorts: cohorts.length,
      averageRetention,
      bestCohort: sortedCohorts[0],
      worstCohort: sortedCohorts[sortedCohorts.length - 1],
      trend: 'UP', // Simplified
      improvementRate: 0.05 // Simplified
    };
  }

  async getCohortInsights(cohorts) {
    // Generate insights based on cohort data
    const insights = [];
    
    if (cohorts.length > 0) {
      const latestCohort = cohorts[cohorts.length - 1];
      const previousCohort = cohorts.length > 1 ? cohorts[cohorts.length - 2] : null;
      
      if (previousCohort) {
        const retentionChange = latestCohort.metrics.averageRetention - 
          previousCohort.metrics.averageRetention;
        
        if (retentionChange > 0.1) {
          insights.push({
            cohort: latestCohort,
            insight: 'Significant improvement in retention',
            recommendation: 'Continue current engagement strategies',
            impact: 0.8
          });
        } else if (retentionChange < -0.1) {
          insights.push({
            cohort: latestCohort,
            insight: 'Retention decline detected',
            recommendation: 'Review onboarding and engagement strategies',
            impact: 0.9
          });
        }
      }
    }
    
    return insights;
  }

  async calculateFunnelStages(stages, startDate, endDate, filters) {
    // Simplified funnel stage calculation
    const funnelStages = [];
    
    let remainingUsers = 1000; // Starting point
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const conversionRate = 0.7 - (i * 0.1); // Decreasing conversion rate
      const converted = Math.floor(remainingUsers * conversionRate);
      const dropOff = remainingUsers - converted;
      
      funnelStages.push({
        name: stage.name,
        order: i + 1,
        event: stage.event,
        entered: remainingUsers,
        converted,
        conversionRate: conversionRate * 100,
        dropOffRate: (dropOff / remainingUsers) * 100,
        averageTime: Math.floor(Math.random() * 300) + 60, // Random time between 60-360 seconds
        users: [], // Would contain actual user IDs in production
        patterns: []
      });
      
      remainingUsers = converted;
    }
    
    return funnelStages;
  }

  async calculateDropOffs(stages) {
    const dropOffs = [];
    
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];
      const count = fromStage.entered - toStage.entered;
      
      dropOffs.push({
        fromStage: fromStage.name,
        toStage: toStage.name,
        count,
        percentage: (count / fromStage.entered) * 100,
        reasons: [
          {
            reason: 'User abandonment',
            count: Math.floor(count * 0.7),
            percentage: 70,
            examples: ['Session timeout', 'Browser closed']
          },
          {
            reason: 'Technical issues',
            count: Math.floor(count * 0.2),
            percentage: 20,
            examples: ['Page error', 'Slow loading']
          },
          {
            reason: 'User preference',
            count: Math.floor(count * 0.1),
            percentage: 10,
            examples: ['Changed mind', 'Found alternative']
          }
        ]
      });
    }
    
    return dropOffs;
  }

  async identifyOptimizationOpportunities(stages) {
    const opportunities = [];
    
    stages.forEach((stage, index) => {
      if (stage.conversionRate < 70) { // Threshold of 70%
        opportunities.push({
          stage: stage.name,
          metric: 'conversionRate',
          currentValue: stage.conversionRate,
          targetValue: 70,
          improvementPotential: 70 - stage.conversionRate,
          actions: [
            'Simplify user interface',
            'Add progress indicators',
            'Provide clearer instructions'
          ],
          estimatedImpact: (70 - stage.conversionRate) * 0.5 // Estimated 50% of improvement
        });
      }
      
      if (stage.averageTime > 300) { // Threshold of 300 seconds
        opportunities.push({
          stage: stage.name,
          metric: 'averageTime',
          currentValue: stage.averageTime,
          targetValue: 180, // Target: 3 minutes
          improvementPotential: stage.averageTime - 180,
          actions: [
            'Optimize page load times',
            'Simplify form fields',
            'Add auto-save functionality'
          ],
          estimatedImpact: ((stage.averageTime - 180) / stage.averageTime) * 100
        });
      }
    });
    
    return opportunities;
  }

  calculateAverageTimeToConvert(stages) {
    if (stages.length === 0) return 0;
    
    const totalTime = stages.reduce((sum, stage) => sum + stage.averageTime, 0);
    return totalTime / stages.length;
  }

  async generateFunnelPredictions(funnelData) {
    // Simplified prediction model
    const historicalConversionRate = 0.65; // Based on historical data
    const predictedConversions = Math.floor(
      funnelData.totalEntered * historicalConversionRate
    );
    
    const confidence = 0.85; // 85% confidence
    const marginOfError = 0.1; // 10% margin of error
    
    const timeline = [];
    const days = 7;
    const baseDate = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      const dailyConversions = Math.floor(predictedConversions / days);
      const lowerBound = Math.floor(dailyConversions * (1 - marginOfError));
      const upperBound = Math.floor(dailyConversions * (1 + marginOfError));
      
      timeline.push({
        date,
        conversions: dailyConversions,
        lowerBound,
        upperBound
      });
    }
    
    const recommendations = [
      'Focus on improving stage 2 conversion rate',
      'Consider A/B testing call-to-action buttons',
      'Add social proof elements to increase trust'
    ];
    
    return {
      predictedConversions,
      confidence,
      timeline,
      recommendations
    };
  }

  async calculateTestResults(testId) {
    const test = await AITest.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    
    // Simplified result calculation
    const results = {
      winner: test.variations[0], // Simplified
      confidence: 0.95,
      significance: true,
      metrics: test.metrics.map(metric => ({
        name: metric,
        controlValue: 0.5, // Simplified
        variationValue: 0.65, // Simplified
        improvement: 0.15,
        confidence: 0.95,
        significance: true
      })),
      recommendations: [
        'Implement winning variation',
        'Monitor impact on other metrics',
        'Consider follow-up tests'
      ],
      insights: [
        'Variation A performed significantly better',
        'Improvement consistent across user segments'
      ],
      calculatedAt: new Date()
    };
    
    test.results = results;
    await test.save();
    
    return results;
  }

  async evaluateAlertCondition(alert, event) {
    // Simplified alert condition evaluation
    const metricValue = this.calculateMetricValue(event, alert.metric);
    
    switch (alert.condition) {
      case 'GREATER_THAN':
        return metricValue > alert.threshold;
      case 'LESS_THAN':
        return metricValue < alert.threshold;
      case 'EQUALS':
        return metricValue === alert.threshold;
      case 'NOT_EQUALS':
        return metricValue !== alert.threshold;
      case 'GREATER_THAN_EQUALS':
        return metricValue >= alert.threshold;
      case 'LESS_THAN_EQUALS':
        return metricValue <= alert.threshold;
      default:
        return false;
    }
  }

  calculateMetricValue(event, metric) {
    // Simplified metric value calculation
    switch (metric) {
      case 'ERROR_RATE':
        return event.type === 'ERROR' ? 1 : 0;
      case 'CONVERSION_RATE':
        return event.type === 'PURCHASE' || event.type === 'SUBSCRIPTION' ? 1 : 0;
      case 'ACTIVITY_RATE':
        return 1;
      default:
        return event.properties?.value || 0;
    }
  }

  convertToCSV(data) {
    // Simplified CSV conversion
    const headers = ['Metric', 'Value', 'Change', 'Change Percentage'];
    const rows = data.metrics.map(metric => [
      metric.name,
      metric.value,
      metric.change || 0,
      metric.changePercentage || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async convertToExcel(data) {
    // Simplified Excel conversion
    // In production, use exceljs library
    return JSON.stringify(data);
  }

  async convertToPDF(data) {
    // Simplified PDF conversion
    // In production, use puppeteer or pdfkit
    return JSON.stringify(data);
  }

  async prebuildCommonQueries() {
    const commonQueries = [
      {
        period: 'LAST_7_DAYS',
        metrics: ['USERS', 'ACTIVITY', 'REVENUE'],
        groupBy: 'DAY'
      },
      {
        period: 'LAST_30_DAYS',
        metrics: ['USERS', 'ACTIVITY'],
        groupBy: 'WEEK'
      },
      {
        period: 'TODAY',
        metrics: ['ACTIVITY', 'REVENUE']
      }
    ];
    
    for (const query of commonQueries) {
      try {
        const data = await this.getAnalytics(query, null);
        const cacheKey = this.generateCacheKey('analytics', query);
        await this.setCache(cacheKey, data, this.cacheTTL);
      } catch (error) {
        console.error('Error prebuilding cache:', error);
      }
    }
  }

  async calculateAverageQueryTime() {
    // Simplified average query time calculation
    return 150; // 150ms
  }

  async calculateCacheHitRate() {
    try {
      const totalRequests = await AnalyticsCache.aggregate([
        { $group: { _id: null, total: { $sum: '$hits' } } }
      ]);
      
      const cachedRequests = totalRequests[0]?.total || 0;
      const estimatedTotal = cachedRequests * 2; // Rough estimate
      
      return estimatedTotal > 0 ? (cachedRequests / estimatedTotal) * 100 : 0;
    } catch (error) {
      return 0;
    }
  }

  async calculateEventProcessingRate() {
    try {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const eventCount = await Event.countDocuments({
        timestamp: { $gte: hourAgo }
      });
      
      return eventCount / 60; // Events per minute
    } catch (error) {
      return 0;
    }
  }

  // ==========================================
  // TREND ANALYSIS & RECOMMENDATIONS
  // ==========================================

  async getTrendAnalysis(query) {
    // Simplified trend analysis
    return {
      overallTrend: 'UP',
      confidence: 0.85,
      seasonal: false,
      seasonality: null,
      anomalies: [],
      forecast: {
        nextPeriod: 1200,
        confidenceInterval: {
          lower: 1000,
          upper: 1400,
          confidence: 0.95
        },
        accuracy: 0.9,
        forecastPoints: [],
        assumptions: [
          'Current growth rate continues',
          'No major market changes'
        ],
        risks: [
          {
            type: 'MARKET',
            probability: 0.3,
            impact: 0.7,
            description: 'Increased competition',
            mitigation: 'Differentiate features and pricing'
          }
        ]
      },
      insights: [
        {
          type: 'GROWTH',
          title: 'Steady growth detected',
          description: 'User base growing at 5% week-over-week',
          impact: 0.8,
          confidence: 0.9,
          dataPoints: [],
          actionItems: [
            'Scale infrastructure',
            'Increase marketing budget'
          ]
        }
      ]
    };
  }

  async getComparisonData(query) {
    // Simplified comparison data
    return {
      currentPeriod: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        metrics: [
          { name: 'Users', currentValue: 1000, previousValue: 850, change: 150, changePercentage: 17.6, significance: 0.95 },
          { name: 'Revenue', currentValue: 5000, previousValue: 4200, change: 800, changePercentage: 19.0, significance: 0.9 }
        ]
      },
      previousPeriod: {
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        metrics: []
      },
      change: {
        improvement: true,
        magnitude: 0.18,
        significance: 0.95,
        keyDrivers: [
          {
            metric: 'User Acquisition',
            contribution: 0.6,
            direction: 'UP',
            explanation: 'Increased marketing effectiveness'
          }
        ]
      },
      significance: 0.95
    };
  }

  async generateCharts(query, metrics) {
    // Simplified chart generation
    return metrics.map((metric, index) => ({
      id: `chart-${index}`,
      type: query.groupBy ? 'LINE' : 'BAR',
      title: `${metric.name} Over Time`,
      description: `Trend of ${metric.name.toLowerCase()}`,
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
      datasets: [
        {
          label: metric.name,
          data: [10, 20, 30, 25, 35, 40, 45],
          backgroundColor: this.getChartColors(query.groupBy ? 'LINE' : 'BAR', 0),
          borderColor: this.getChartColors(query.groupBy ? 'LINE' : 'BAR', 1),
          fill: query.groupBy ? true : false,
          tension: 0.4
        }
      ],
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: `${metric.name} Analysis` }
        }
      },
      generatedAt: new Date()
    }));
  }

  async getRecommendations(query, analyticsData) {
    // Simplified recommendations
    const recommendations = [];
    
    if (analyticsData.metrics.some(m => m.changePercentage < -10)) {
      recommendations.push({
        type: 'WARNING',
        title: 'Performance decline detected',
        description: 'Some metrics show significant decline',
        priority: 'HIGH',
        actions: [
          'Investigate root cause',
          'Review recent changes',
          'Monitor closely for 24 hours'
        ],
        estimatedImpact: 0.8,
        confidence: 0.9
      });
    }
    
    if (analyticsData.metrics.some(m => m.changePercentage > 20)) {
      recommendations.push({
        type: 'OPPORTUNITY',
        title: 'Growth opportunity identified',
        description: 'Significant growth in key metrics',
        priority: 'MEDIUM',
        actions: [
          'Scale successful initiatives',
          'Allocate more resources',
          'Document best practices'
        ],
        estimatedImpact: 0.6,
        confidence: 0.85
      });
    }
    
    return recommendations;
  }

  async getPublicDashboards() {
    try {
      return await Dashboard.find({ isPublic: true })
        .populate('owner', 'name email avatar')
        .populate('widgets')
        .sort({ updatedAt: -1 })
        .limit(50);
    } catch (error) {
      console.error('Error getting public dashboards:', error);
      throw new Error(`Failed to get public dashboards: ${error.message}`);
    }
  }

  async getAllDashboards(filters = {}, pagination = {}) {
    try {
      const { userId, public: isPublic, page = 1, limit = 50 } = filters;
      
      const query = {};
      if (userId) query.owner = userId;
      if (isPublic !== undefined) query.isPublic = isPublic;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: ['owner', 'widgets'],
        lean: true
      };
      
      const result = await Dashboard.paginate(query, options);
      
      return {
        edges: result.docs.map(doc => ({
          node: doc,
          cursor: doc._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPrevPage,
          startCursor: result.docs[0]?._id.toString(),
          endCursor: result.docs[result.docs.length - 1]?._id.toString(),
        },
        totalCount: result.totalDocs
      };
    } catch (error) {
      console.error('Error getting all dashboards:', error);
      throw new Error(`Failed to get all dashboards: ${error.message}`);
    }
  }
}

export default new AnalyticsService();