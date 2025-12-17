// apps/backend/src/graphql/schema/resolvers/analytics.resolver.js
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import analyticsService from '../../services/analytics/analytics.service.js';
import metricsService from '../../services/analytics/metrics.service.js';
import reportingService from '../../services/analytics/reporting.service.js';
import { pubsub, EVENTS } from '../../socket/events/events.js';

export const analyticsResolver = {
  // ==========================================
  // QUERIES
  // ==========================================
  Query: {
    // Analytics Queries
    analytics: async (_, { query }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return analyticsService.getAnalytics(query, user);
    },

    metric: async (_, { metric, query }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return metricsService.getMetric(metric, query, user);
    },

    compare: async (_, { query, compareWith }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return analyticsService.compareAnalytics(query, compareWith, user);
    },

    // Reports
    myReports: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return reportingService.getUserReports(user.id);
    },

    report: async (_, { reportId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const report = await reportingService.getReportById(reportId);
      if (!report) {
        throw new UserInputError('Report not found');
      }
      
      // Check access
      const hasAccess = await reportingService.checkReportAccess(reportId, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to view this report');
      }
      
      return report;
    },

    reportResult: async (_, { reportId, runId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const hasAccess = await reportingService.checkReportAccess(reportId, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to view this report');
      }
      
      return reportingService.getReportResult(reportId, runId);
    },

    // Dashboards
    myDashboards: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return analyticsService.getUserDashboards(user.id);
    },

    dashboard: async (_, { dashboardId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      const hasAccess = await analyticsService.checkDashboardAccess(dashboardId, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to view this dashboard');
      }
      
      return dashboard;
    },

    publicDashboards: async () => {
      return analyticsService.getPublicDashboards();
    },

    // Events & Sessions
    events: async (_, { type, userId, startDate, endDate, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      // Only admins can view other users' events
      if (userId && userId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to view other users\' events');
      }
      
      const targetUserId = userId || user.id;
      return analyticsService.getEvents({ type, userId: targetUserId, startDate, endDate }, pagination);
    },

    sessions: async (_, { userId, startDate, endDate, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (userId && userId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to view other users\' sessions');
      }
      
      const targetUserId = userId || user.id;
      return analyticsService.getSessions({ userId: targetUserId, startDate, endDate }, pagination);
    },

    session: async (_, { sessionId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const session = await analyticsService.getSessionById(sessionId);
      if (!session) {
        throw new UserInputError('Session not found');
      }
      
      // Check access
      if (session.userId && session.userId.toString() !== user.id) {
        if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
          throw new ForbiddenError('You do not have permission to view this session');
        }
      }
      
      return session;
    },

    // Advanced Analytics
    cohortAnalysis: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access cohort analysis');
      }
      
      return analyticsService.getCohortAnalysis(input);
    },

    funnelAnalysis: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access funnel analysis');
      }
      
      return analyticsService.getFunnelAnalysis(input);
    },

    // A/B Testing
    tests: async (_, { status }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access A/B tests');
      }
      
      return analyticsService.getTests(status);
    },

    test: async (_, { testId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access A/B tests');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      return test;
    },

    // Real-time
    realTimeMetrics: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access real-time metrics');
      }
      
      return metricsService.getRealTimeMetrics();
    },

    liveUpdates: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access live updates');
      }
      
      return metricsService.getLiveUpdates();
    },

    alerts: async (_, { type, severity, acknowledged, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access alerts');
      }
      
      return analyticsService.getAlerts({ type, severity, acknowledged }, pagination);
    },

    // Admin
    allReports: async (_, { userId, status, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access all reports');
      }
      
      return reportingService.getAllReports({ userId, status }, pagination);
    },

    allDashboards: async (_, { userId, public: isPublic, pagination }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access all dashboards');
      }
      
      return analyticsService.getAllDashboards({ userId, public: isPublic }, pagination);
    },

    analyticsHealth: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to access analytics health');
      }
      
      return analyticsService.getHealthStatus();
    },
  },

  // ==========================================
  // MUTATIONS
  // ==========================================
  Mutation: {
    // Event Tracking
    trackEvent: async (_, { input }, { user, req }) => {
      // Events can be tracked anonymously
      const eventData = {
        ...input,
        userId: user?.id || input.userId,
        sessionId: input.sessionId || req?.sessionID,
        ipAddress: req?.ip,
        userAgent: input.userAgent || req?.headers['user-agent'],
      };
      
      const event = await analyticsService.trackEvent(eventData);
      
      // Publish real-time update
      pubsub.publish(EVENTS.REAL_TIME_UPDATE, {
        realTimeUpdate: {
          type: 'EVENT',
          data: event,
          timestamp: new Date(),
        },
      });
      
      return event;
    },

    trackBatchEvents: async (_, { events }, { user, req }) => {
      const trackedEvents = await Promise.all(
        events.map(async (eventInput) => {
          const eventData = {
            ...eventInput,
            userId: user?.id || eventInput.userId,
            sessionId: eventInput.sessionId || req?.sessionID,
            ipAddress: req?.ip,
            userAgent: eventInput.userAgent || req?.headers['user-agent'],
          };
          return analyticsService.trackEvent(eventData);
        })
      );
      
      return trackedEvents;
    },

    // Reports
    createReport: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return reportingService.createReport({
        ...input,
        createdBy: user.id,
      });
    },

    updateReport: async (_, { reportId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const report = await reportingService.getReportById(reportId);
      if (!report) {
        throw new UserInputError('Report not found');
      }
      
      if (report.createdBy.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to update this report');
      }
      
      return reportingService.updateReport(reportId, input);
    },

    deleteReport: async (_, { reportId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const report = await reportingService.getReportById(reportId);
      if (!report) {
        throw new UserInputError('Report not found');
      }
      
      if (report.createdBy.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to delete this report');
      }
      
      await reportingService.deleteReport(reportId);
      
      return {
        success: true,
        message: 'Report deleted successfully',
      };
    },

    runReport: async (_, { reportId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const hasAccess = await reportingService.checkReportAccess(reportId, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to run this report');
      }
      
      const reportRun = await reportingService.runReport(reportId, user.id);
      
      // Publish completion event
      pubsub.publish(EVENTS.REPORT_COMPLETED, {
        reportCompleted: reportRun,
      });
      
      return reportRun;
    },

    scheduleReport: async (_, { reportId, schedule }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const report = await reportingService.getReportById(reportId);
      if (!report) {
        throw new UserInputError('Report not found');
      }
      
      if (report.createdBy.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to schedule this report');
      }
      
      return reportingService.scheduleReport(reportId, schedule);
    },

    unscheduleReport: async (_, { reportId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const report = await reportingService.getReportById(reportId);
      if (!report) {
        throw new UserInputError('Report not found');
      }
      
      if (report.createdBy.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to unschedule this report');
      }
      
      return reportingService.unscheduleReport(reportId);
    },

    // Dashboards
    createDashboard: async (_, { name, description }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      return analyticsService.createDashboard({
        name,
        description,
        owner: user.id,
      });
    },

    updateDashboard: async (_, { dashboardId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      const hasEditAccess = await analyticsService.checkDashboardEditAccess(dashboardId, user.id, user.role);
      if (!hasEditAccess) {
        throw new ForbiddenError('You do not have permission to edit this dashboard');
      }
      
      return analyticsService.updateDashboard(dashboardId, input);
    },

    deleteDashboard: async (_, { dashboardId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      if (dashboard.owner.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to delete this dashboard');
      }
      
      await analyticsService.deleteDashboard(dashboardId);
      
      return {
        success: true,
        message: 'Dashboard deleted successfully',
      };
    },

    duplicateDashboard: async (_, { dashboardId, newName }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const hasAccess = await analyticsService.checkDashboardAccess(dashboardId, user.id, user.role);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to duplicate this dashboard');
      }
      
      return analyticsService.duplicateDashboard(dashboardId, newName, user.id);
    },

    // Widgets
    addWidget: async (_, { dashboardId, widget }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const hasEditAccess = await analyticsService.checkDashboardEditAccess(dashboardId, user.id, user.role);
      if (!hasEditAccess) {
        throw new ForbiddenError('You do not have permission to add widgets to this dashboard');
      }
      
      return analyticsService.addWidget(dashboardId, widget);
    },

    updateWidget: async (_, { widgetId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const widget = await analyticsService.getWidgetById(widgetId);
      if (!widget) {
        throw new UserInputError('Widget not found');
      }
      
      const hasEditAccess = await analyticsService.checkDashboardEditAccess(widget.dashboardId, user.id, user.role);
      if (!hasEditAccess) {
        throw new ForbiddenError('You do not have permission to update this widget');
      }
      
      return analyticsService.updateWidget(widgetId, input);
    },

    removeWidget: async (_, { widgetId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const widget = await analyticsService.getWidgetById(widgetId);
      if (!widget) {
        throw new UserInputError('Widget not found');
      }
      
      const hasEditAccess = await analyticsService.checkDashboardEditAccess(widget.dashboardId, user.id, user.role);
      if (!hasEditAccess) {
        throw new ForbiddenError('You do not have permission to remove this widget');
      }
      
      await analyticsService.removeWidget(widgetId);
      
      return {
        success: true,
        message: 'Widget removed successfully',
      };
    },

    rearrangeWidgets: async (_, { dashboardId, layout }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const hasEditAccess = await analyticsService.checkDashboardEditAccess(dashboardId, user.id, user.role);
      if (!hasEditAccess) {
        throw new ForbiddenError('You do not have permission to rearrange widgets');
      }
      
      return analyticsService.rearrangeWidgets(dashboardId, layout);
    },

    // Sharing
    shareDashboard: async (_, { dashboardId, userIds, permission }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      if (dashboard.owner.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to share this dashboard');
      }
      
      return analyticsService.shareDashboard(dashboardId, userIds, permission);
    },

    unshareDashboard: async (_, { dashboardId, userIds }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      if (dashboard.owner.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to unshare this dashboard');
      }
      
      return analyticsService.unshareDashboard(dashboardId, userIds);
    },

    makeDashboardPublic: async (_, { dashboardId, public: isPublic }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      const dashboard = await analyticsService.getDashboardById(dashboardId);
      if (!dashboard) {
        throw new UserInputError('Dashboard not found');
      }
      
      if (dashboard.owner.toString() !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to change dashboard visibility');
      }
      
      return analyticsService.makeDashboardPublic(dashboardId, isPublic);
    },

    // A/B Testing
    createTest: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to create A/B tests');
      }
      
      return analyticsService.createTest({
        ...input,
        createdBy: user.id,
      });
    },

    updateTest: async (_, { testId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to update A/B tests');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      return analyticsService.updateTest(testId, input);
    },

    deleteTest: async (_, { testId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to delete A/B tests');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      await analyticsService.deleteTest(testId);
      
      return {
        success: true,
        message: 'Test deleted successfully',
      };
    },

    startTest: async (_, { testId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to start A/B tests');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      if (test.status !== 'DRAFT' && test.status !== 'PAUSED') {
        throw new UserInputError('Test can only be started from DRAFT or PAUSED status');
      }
      
      return analyticsService.startTest(testId);
    },

    stopTest: async (_, { testId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to stop A/B tests');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      if (test.status !== 'RUNNING') {
        throw new UserInputError('Test can only be stopped when RUNNING');
      }
      
      return analyticsService.stopTest(testId);
    },

    declareWinner: async (_, { testId, variationId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to declare test winners');
      }
      
      const test = await analyticsService.getTestById(testId);
      if (!test) {
        throw new UserInputError('Test not found');
      }
      
      const variation = test.variations.find((v) => v.id === variationId);
      if (!variation) {
        throw new UserInputError('Variation not found in test');
      }
      
      return analyticsService.declareWinner(testId, variationId);
    },

    // Alerts
    createAlert: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to create alerts');
      }
      
      return analyticsService.createAlert({
        ...input,
        createdBy: user.id,
      });
    },

    updateAlert: async (_, { alertId, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to update alerts');
      }
      
      const alert = await analyticsService.getAlertById(alertId);
      if (!alert) {
        throw new UserInputError('Alert not found');
      }
      
      return analyticsService.updateAlert(alertId, input);
    },

    deleteAlert: async (_, { alertId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to delete alerts');
      }
      
      const alert = await analyticsService.getAlertById(alertId);
      if (!alert) {
        throw new UserInputError('Alert not found');
      }
      
      await analyticsService.deleteAlert(alertId);
      
      return {
        success: true,
        message: 'Alert deleted successfully',
      };
    },

    acknowledgeAlert: async (_, { alertId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to acknowledge alerts');
      }
      
      const alert = await analyticsService.getAlertById(alertId);
      if (!alert) {
        throw new UserInputError('Alert not found');
      }
      
      return analyticsService.acknowledgeAlert(alertId, user.id);
    },

    // Data Management
    exportData: async (_, { query, format }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to export data');
      }
      
      return analyticsService.exportData(query, format);
    },

    purgeOldData: async (_, { olderThan }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Only super admins can purge data');
      }
      
      const result = await analyticsService.purgeOldData(olderThan);
      
      return {
        success: true,
        message: `Purged ${result.deletedCount} records older than ${olderThan}`,
      };
    },

    // Admin
    recalculateMetrics: async (_, { metric, startDate, endDate }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to recalculate metrics');
      }
      
      await metricsService.recalculateMetrics(metric, startDate, endDate);
      
      return {
        success: true,
        message: `Metrics recalculation started for ${metric}`,
      };
    },

    rebuildCache: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Only super admins can rebuild cache');
      }
      
      await analyticsService.rebuildCache();
      
      return {
        success: true,
        message: 'Cache rebuild initiated',
      };
    },

    runDiagnostics: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new ForbiddenError('You do not have permission to run diagnostics');
      }
      
      return analyticsService.runDiagnostics();
    },
  },

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  Subscription: {
    realTimeUpdate: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.REAL_TIME_UPDATE]),
        (_, __, context) => {
          if (!context.user) return false;
          return ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(context.user.role);
        }
      ),
    },

    alertTriggered: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.ALERT_TRIGGERED]),
        (_, __, context) => {
          if (!context.user) return false;
          return ['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(context.user.role);
        }
      ),
    },

    metricUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.METRIC_UPDATED]),
        (payload, variables, context) => {
          if (!context.user) return false;
          
          if (!['ADMIN', 'SUPER_ADMIN', 'ANALYTICS_VIEWER'].includes(context.user.role)) {
            return false;
          }
          
          return payload.metricUpdated.metric === variables.metric;
        }
      ),
    },

    reportCompleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.REPORT_COMPLETED]),
        async (payload, variables, context) => {
          if (!context.user) return false;
          
          if (variables.reportId !== payload.reportCompleted.reportId) {
            return false;
          }
          
          // Check if user has access to this report
          const hasAccess = await reportingService.checkReportAccess(
            variables.reportId,
            context.user.id,
            context.user.role
          );
          
          return hasAccess;
        }
      ),
    },
  },

  // ==========================================
  // FIELD RESOLVERS
  // ==========================================
  AnalyticsData: {
    summary: async (parent) => {
      return metricsService.getSummaryMetrics(parent.query);
    },

    trends: async (parent) => {
      return analyticsService.getTrendAnalysis(parent.query);
    },

    comparison: async (parent) => {
      if (!parent.compareWithPrevious) return null;
      return analyticsService.getComparisonData(parent.query);
    },

    charts: async (parent) => {
      return analyticsService.generateCharts(parent.query, parent.metrics);
    },

    recommendations: async (parent) => {
      return analyticsService.getRecommendations(parent.query);
    },
  },

  Report: {
    id: (parent) => parent._id || parent.id,
    
    createdBy: async (parent, _, { loaders }) => {
      return loaders.userLoader.load(parent.createdBy.toString());
    },

    lastResult: async (parent) => {
      return reportingService.getLastReportResult(parent._id || parent.id);
    },

    history: async (parent) => {
      return reportingService.getReportHistory(parent._id || parent.id);
    },

    nextRun: (parent) => {
      if (!parent.schedule) return null;
      return reportingService.calculateNextRun(parent.schedule);
    },
  },

  Dashboard: {
    id: (parent) => parent._id || parent.id,
    
    owner: async (parent, _, { loaders }) => {
      return loaders.userLoader.load(parent.owner.toString());
    },

    sharedWith: async (parent, _, { loaders }) => {
      if (!parent.sharedWith || parent.sharedWith.length === 0) return [];
      return Promise.all(
        parent.sharedWith.map((userId) => loaders.userLoader.load(userId.toString()))
      );
    },

    widgets: async (parent) => {
      return analyticsService.getDashboardWidgets(parent._id || parent.id);
    },
  },

  Widget: {
    id: (parent) => parent._id || parent.id,
    
    data: async (parent) => {
      return analyticsService.getWidgetData(parent._id || parent.id, parent.query);
    },
  },

  Event: {
    id: (parent) => parent._id || parent.id,
    
    user: async (parent, _, { loaders }) => {
      if (!parent.userId) return null;
      return loaders.userLoader.load(parent.userId.toString());
    },
  },

  Session: {
    id: (parent) => parent._id || parent.id,
    
    user: async (parent, _, { loaders }) => {
      if (!parent.userId) return null;
      return loaders.userLoader.load(parent.userId.toString());
    },

    events: async (parent) => {
      return analyticsService.getSessionEvents(parent._id || parent.id);
    },

    duration: (parent) => {
      if (!parent.endTime) {
        return Math.floor((new Date() - new Date(parent.startTime)) / 1000);
      }
      return Math.floor((new Date(parent.endTime) - new Date(parent.startTime)) / 1000);
    },
  },

  AITest: {
    id: (parent) => parent._id || parent.id,
    
    results: async (parent) => {
      if (parent.status !== 'COMPLETED' && parent.status !== 'STOPPED') {
        return null;
      }
      return analyticsService.getTestResults(parent._id || parent.id);
    },
  },

  Alert: {
    id: (parent) => parent._id || parent.id,
    
    acknowledgedBy: async (parent, _, { loaders }) => {
      if (!parent.acknowledgedBy) return null;
      return loaders.userLoader.load(parent.acknowledgedBy.toString());
    },
  },

  CohortAnalysis: {
    summary: async (parent) => {
      return analyticsService.getCohortSummary(parent.cohorts);
    },

    insights: async (parent) => {
      return analyticsService.getCohortInsights(parent.cohorts);
    },
  },

  FunnelAnalysis: {
    overallConversionRate: (parent) => {
      if (!parent.totalEntered || parent.totalEntered === 0) return 0;
      return (parent.totalConverted / parent.totalEntered) * 100;
    },

    dropOffs: async (parent) => {
      return analyticsService.calculateDropOffs(parent.stages);
    },

    opportunities: async (parent) => {
      return analyticsService.identifyOptimizationOpportunities(parent.stages);
    },

    predictions: async (parent) => {
      return analyticsService.generateFunnelPredictions(parent);
    },
  },

  RealTimeMetrics: {
    recentEvents: async () => {
      return metricsService.getRecentEvents(50); // Last 50 events
    },

    updates: async () => {
      return metricsService.getRecentUpdates(100); // Last 100 updates
    },

    alerts: async () => {
      return analyticsService.getActiveAlerts();
    },
  },
};

export default analyticsResolver;