// apps/backend/src/graphql/schema/typeDefs/admin/analyticsManagement.typeDef.js

import { gql } from 'apollo-server-express';

const analyticsManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================

  enum TimeGranularity {
    HOURLY
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
  }

  enum MetricType {
    USERS
    SOLUTIONS
    JOBS
    MARKETPLACE
    REVENUE
    ENGAGEMENT
    RETENTION
    ACQUISITION
    CONVERSION
  }

  enum ReportType {
    OVERVIEW
    USER_ANALYTICS
    CONTENT_ANALYTICS
    REVENUE_ANALYTICS
    ENGAGEMENT_ANALYTICS
    RETENTION_ANALYTICS
    GEOGRAPHIC_ANALYTICS
    SUBSCRIPTION_ANALYTICS
    CUSTOM
  }

  enum ReportFormat {
    JSON
    CSV
    PDF
    EXCEL
  }

  enum ReportStatus {
    PENDING
    GENERATING
    COMPLETED
    FAILED
  }

  enum DashboardWidgetType {
    STAT_CARD
    LINE_CHART
    BAR_CHART
    PIE_CHART
    TABLE
    MAP
    FUNNEL
    HEATMAP
  }

  # ============================================
  # TYPES
  # ============================================

  type PlatformOverview {
    # User Metrics
    totalUsers: Int!
    activeUsers: Int!
    newUsersToday: Int!
    newUsersThisWeek: Int!
    newUsersThisMonth: Int!
    verifiedUsers: Int!
    
    # Content Metrics
    totalSolutions: Int!
    totalJobs: Int!
    totalMarketplaceListings: Int!
    totalSquads: Int!
    
    # Engagement Metrics
    dailyActiveUsers: Int!
    monthlyActiveUsers: Int!
    averageSessionDuration: Float!
    pageViewsToday: Int!
    
    # Revenue Metrics
    totalRevenue: Int!
    revenueToday: Int!
    revenueThisWeek: Int!
    revenueThisMonth: Int!
    
    # Growth Metrics
    userGrowthRate: Float!
    revenueGrowthRate: Float!
    
    # Timestamp
    generatedAt: DateTime!
  }

  type UserAnalytics {
    # Totals
    totalUsers: Int!
    activeUsers: Int!
    inactiveUsers: Int!
    
    # Registration Trends
    registrationTrend: [TimeSeriesDataPoint!]!
    
    # Demographics
    byCountry: [CountryDistribution!]!
    bySubscriptionTier: [TierDistribution!]!
    byEmploymentStatus: [EmploymentDistribution!]!
    byTechStack: [TechStackDistribution!]!
    
    # Verification
    verifiedPercentage: Float!
    pendingVerification: Int!
    
    # Activity
    dau: Int!
    wau: Int!
    mau: Int!
    dauMauRatio: Float!
    
    # Cohort Analysis
    cohortRetention: [CohortData!]!
    
    # User Segments
    segments: [UserSegment!]!
  }

  type TimeSeriesDataPoint {
    timestamp: DateTime!
    value: Float!
    label: String
  }

  type CountryDistribution {
    country: String!
    countryCode: String!
    count: Int!
    percentage: Float!
  }

  type TierDistribution {
    tier: SubscriptionTier!
    count: Int!
    percentage: Float!
    revenue: Int!
  }

  type EmploymentDistribution {
    status: String!
    count: Int!
    percentage: Float!
  }

  type TechStackDistribution {
    technology: String!
    count: Int!
    percentage: Float!
  }

  type CohortData {
    cohortDate: DateTime!
    cohortSize: Int!
    retentionByWeek: [Float!]!
  }

  type UserSegment {
    name: String!
    criteria: String!
    count: Int!
    percentage: Float!
  }

  type ContentAnalytics {
    # Solutions
    solutionStats: SolutionAnalytics!
    
    # Jobs
    jobStats: JobAnalytics!
    
    # Marketplace
    marketplaceStats: MarketplaceAnalytics!
    
    # Chat
    chatStats: ChatAnalytics!
    
    # Top Content
    topSolutions: [Solution!]!
    topJobs: [Job!]!
    topCategories: [CategoryStats!]!
  }

  type SolutionAnalytics {
    total: Int!
    newToday: Int!
    newThisWeek: Int!
    newThisMonth: Int!
    premiumSolutions: Int!
    averageRating: Float!
    totalRatings: Int!
    byCategory: [CategoryStats!]!
    trend: [TimeSeriesDataPoint!]!
  }

  type JobAnalytics {
    total: Int!
    active: Int!
    newToday: Int!
    newThisMonth: Int!
    totalApplications: Int!
    averageApplicationsPerJob: Float!
    collaborationPosts: Int!
    byCategory: [CategoryStats!]!
    trend: [TimeSeriesDataPoint!]!
  }

  type MarketplaceAnalytics {
    totalListings: Int!
    activeListings: Int!
    totalTransactions: Int!
    transactionVolume: Int!
    activeBounties: Int!
    completedBounties: Int!
    averageListingPrice: Float!
    byCategory: [CategoryStats!]!
    trend: [TimeSeriesDataPoint!]!
  }

  type ChatAnalytics {
    totalMessages: Int!
    messagesPerDay: Float!
    activeRooms: Int!
    premiumChatUsage: Int!
    announcementsSent: Int!
    byRoomType: [RoomTypeStats!]!
    peakHours: [HourlyActivity!]!
  }

  type CategoryStats {
    category: String!
    count: Int!
    percentage: Float!
    growth: Float!
  }

  type RoomTypeStats {
    type: String!
    count: Int!
    messageCount: Int!
    activeUsers: Int!
  }

  type HourlyActivity {
    hour: Int!
    activity: Int!
  }

  type RevenueAnalytics {
    # Totals
    totalRevenue: Int!
    netRevenue: Int!
    refundedAmount: Int!
    
    # By Source
    subscriptionRevenue: Int!
    jobPostingRevenue: Int!
    marketplaceRevenue: Int!
    advertisingRevenue: Int!
    
    # Trends
    revenueTrend: [TimeSeriesDataPoint!]!
    revenueBySource: [RevenueSourceData!]!
    
    # Projections
    projectedMonthlyRevenue: Int!
    projectedYearlyRevenue: Int!
    
    # Key Metrics
    arpu: Float!
    arppu: Float!
    ltv: Float!
    
    # By Country
    revenueByCountry: [CountryRevenue!]!
    
    # Payment Analytics
    paymentMethodBreakdown: [PaymentMethodStats!]!
    successfulPayments: Int!
    failedPayments: Int!
    paymentSuccessRate: Float!
  }

  type RevenueSourceData {
    source: String!
    amount: Int!
    percentage: Float!
    trend: Float!
  }

  type CountryRevenue {
    country: String!
    revenue: Int!
    userCount: Int!
    arpu: Float!
  }

  type PaymentMethodStats {
    method: String!
    count: Int!
    amount: Int!
    percentage: Float!
  }

  type EngagementAnalytics {
    # Session Metrics
    averageSessionDuration: Float!
    sessionsPerUser: Float!
    bounceRate: Float!
    
    # Page Metrics
    pageViews: Int!
    uniquePageViews: Int!
    topPages: [PageStats!]!
    
    # Feature Usage
    featureUsage: [FeatureUsageStats!]!
    
    # Actions
    searchQueries: Int!
    topSearchTerms: [SearchTermStats!]!
    
    # Social Engagement
    totalRatings: Int!
    totalComments: Int!
    totalShares: Int!
  }

  type PageStats {
    path: String!
    views: Int!
    uniqueViews: Int!
    averageTimeOnPage: Float!
    bounceRate: Float!
  }

  type FeatureUsageStats {
    feature: String!
    usageCount: Int!
    uniqueUsers: Int!
    trend: Float!
  }

  type SearchTermStats {
    term: String!
    count: Int!
    resultsFound: Int!
  }

  type RetentionAnalytics {
    # Overall Retention
    day1Retention: Float!
    day7Retention: Float!
    day30Retention: Float!
    day90Retention: Float!
    
    # Churn
    churnRate: Float!
    churnedUsers: Int!
    
    # Cohort Analysis
    cohortRetention: [CohortData!]!
    
    # By Segment
    retentionByTier: [TierRetention!]!
    retentionByCountry: [CountryRetention!]!
    
    # Reactivation
    reactivatedUsers: Int!
    reactivationRate: Float!
  }

  type TierRetention {
    tier: SubscriptionTier!
    day7Retention: Float!
    day30Retention: Float!
    churnRate: Float!
  }

  type CountryRetention {
    country: String!
    day30Retention: Float!
    churnRate: Float!
  }

  type FunnelAnalytics {
    name: String!
    steps: [FunnelStep!]!
    overallConversionRate: Float!
  }

  type FunnelStep {
    name: String!
    count: Int!
    percentage: Float!
    dropOffRate: Float!
  }

  type ScheduledReport {
    id: ID!
    name: String!
    type: ReportType!
    format: ReportFormat!
    
    # Schedule
    cronExpression: String!
    timezone: String!
    nextRunAt: DateTime!
    lastRunAt: DateTime
    
    # Filters
    filters: JSON
    
    # Recipients
    recipients: [String!]!
    
    # Status
    isActive: Boolean!
    lastStatus: ReportStatus
    
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type GeneratedReport {
    id: ID!
    scheduledReport: ScheduledReport
    type: ReportType!
    format: ReportFormat!
    status: ReportStatus!
    
    # Files
    downloadUrl: String
    fileSize: Int
    
    # Period
    periodStart: DateTime!
    periodEnd: DateTime!
    
    # Processing
    startedAt: DateTime!
    completedAt: DateTime
    error: String
    
    createdBy: Admin
    createdAt: DateTime!
  }

  type DashboardConfig {
    id: ID!
    name: String!
    isDefault: Boolean!
    widgets: [DashboardWidget!]!
    layout: JSON!
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DashboardWidget {
    id: ID!
    type: DashboardWidgetType!
    title: String!
    metric: MetricType!
    config: JSON!
    position: WidgetPosition!
  }

  type WidgetPosition {
    x: Int!
    y: Int!
    width: Int!
    height: Int!
  }

  type RealTimeAnalytics {
    activeUsers: Int!
    activeUsersByPage: [PageActiveUsers!]!
    recentEvents: [RealTimeEvent!]!
    eventsPerMinute: Float!
  }

  type PageActiveUsers {
    page: String!
    count: Int!
  }

  type RealTimeEvent {
    type: String!
    userId: ID
    page: String
    timestamp: DateTime!
    metadata: JSON
  }

  # ============================================
  # INPUTS
  # ============================================

  input AnalyticsDateRangeInput {
    startDate: DateTime!
    endDate: DateTime!
    granularity: TimeGranularity
    timezone: String
  }

  input AnalyticsFilterInput {
    countries: [String!]
    subscriptionTiers: [SubscriptionTier!]
    userTypes: [String!]
    categories: [String!]
  }

  input CreateScheduledReportInput {
    name: String!
    type: ReportType!
    format: ReportFormat!
    cronExpression: String!
    timezone: String!
    filters: JSON
    recipients: [String!]!
  }

  input UpdateScheduledReportInput {
    reportId: ID!
    name: String
    cronExpression: String
    timezone: String
    filters: JSON
    recipients: [String!]
    isActive: Boolean
  }

  input GenerateReportInput {
    type: ReportType!
    format: ReportFormat!
    dateRange: AnalyticsDateRangeInput!
    filters: AnalyticsFilterInput
  }

  input CreateDashboardInput {
    name: String!
    isDefault: Boolean
    widgets: [DashboardWidgetInput!]!
    layout: JSON!
  }

  input DashboardWidgetInput {
    type: DashboardWidgetType!
    title: String!
    metric: MetricType!
    config: JSON
    position: WidgetPositionInput!
  }

  input WidgetPositionInput {
    x: Int!
    y: Int!
    width: Int!
    height: Int!
  }

  input UpdateDashboardInput {
    dashboardId: ID!
    name: String
    widgets: [DashboardWidgetInput!]
    layout: JSON
  }

  input FunnelAnalysisInput {
    funnelName: String!
    steps: [String!]!
    dateRange: AnalyticsDateRangeInput!
    filters: AnalyticsFilterInput
  }

  input ComparisonInput {
    metric: MetricType!
    currentPeriod: AnalyticsDateRangeInput!
    comparisonPeriod: AnalyticsDateRangeInput!
    filters: AnalyticsFilterInput
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Overview
    platformOverview: PlatformOverview! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Detailed Analytics
    userAnalytics(dateRange: AnalyticsDateRangeInput!, filters: AnalyticsFilterInput): UserAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    contentAnalytics(dateRange: AnalyticsDateRangeInput!, filters: AnalyticsFilterInput): ContentAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    revenueAnalytics(dateRange: AnalyticsDateRangeInput!, filters: AnalyticsFilterInput): RevenueAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    engagementAnalytics(dateRange: AnalyticsDateRangeInput!, filters: AnalyticsFilterInput): EngagementAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    retentionAnalytics(dateRange: AnalyticsDateRangeInput!, filters: AnalyticsFilterInput): RetentionAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Funnel Analysis
    funnelAnalysis(input: FunnelAnalysisInput!): FunnelAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Comparison
    metricComparison(input: ComparisonInput!): JSON! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Real-time
    realTimeAnalytics: RealTimeAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Reports
    scheduledReports: [ScheduledReport!]! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    scheduledReport(id: ID!): ScheduledReport @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    generatedReports(limit: Int, type: ReportType): [GeneratedReport!]! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    generatedReport(id: ID!): GeneratedReport @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Dashboards
    dashboards: [DashboardConfig!]! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    dashboard(id: ID!): DashboardConfig @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    defaultDashboard: DashboardConfig @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Time Series
    metricTimeSeries(
      metric: MetricType!
      dateRange: AnalyticsDateRangeInput!
      filters: AnalyticsFilterInput
    ): [TimeSeriesDataPoint!]! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Reports
    createScheduledReport(input: CreateScheduledReportInput!): ScheduledReport! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    updateScheduledReport(input: UpdateScheduledReportInput!): ScheduledReport! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    deleteScheduledReport(reportId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    runScheduledReportNow(reportId: ID!): GeneratedReport! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Generate Reports
    generateReport(input: GenerateReportInput!): GeneratedReport! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Dashboards
    createDashboard(input: CreateDashboardInput!): DashboardConfig! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    updateDashboard(input: UpdateDashboardInput!): DashboardConfig! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    deleteDashboard(dashboardId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    setDefaultDashboard(dashboardId: ID!): DashboardConfig! @auth(requires: [SUPER_ADMIN])
    duplicateDashboard(dashboardId: ID!, newName: String!): DashboardConfig! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Data Export
    exportAnalyticsData(
      type: MetricType!
      dateRange: AnalyticsDateRangeInput!
      format: ReportFormat!
    ): String! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    
    # Cache
    refreshAnalyticsCache(metric: MetricType): Boolean! @auth(requires: [SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    realTimeMetrics: RealTimeAnalytics! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
    reportGenerated: GeneratedReport! @auth(requires: [ANALYTICS_ADMIN, SUPER_ADMIN])
  }
`;

export default analyticsManagementTypeDef;