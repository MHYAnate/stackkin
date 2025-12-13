// apps/backend/src/graphql/schema/typeDefs/analytics.typeDef.js
import { gql } from 'apollo-server-express';

export const analyticsTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum AnalyticsPeriod {
    TODAY
    YESTERDAY
    LAST_7_DAYS
    LAST_30_DAYS
    LAST_90_DAYS
    THIS_MONTH
    LAST_MONTH
    THIS_QUARTER
    LAST_QUARTER
    THIS_YEAR
    LAST_YEAR
    CUSTOM
    ALL_TIME
  }

  enum MetricType {
    USERS
    ACTIVITY
    REVENUE
    ENGAGEMENT
    RETENTION
    PERFORMANCE
    QUALITY
    GROWTH
  }

  enum ChartType {
    LINE
    BAR
    PIE
    DOUGHNUT
    AREA
    SCATTER
    BUBBLE
    RADAR
    HEATMAP
    TABLE
  }

  enum GroupBy {
    HOUR
    DAY
    WEEK
    MONTH
    QUARTER
    YEAR
    CATEGORY
    TIER
    COUNTRY
    DEVICE
    SOURCE
  }

  enum EventType {
    PAGE_VIEW
    BUTTON_CLICK
    FORM_SUBMIT
    SEARCH
    FILTER
    SORT
    DOWNLOAD
    SHARE
    LIKE
    COMMENT
    RATING
    PURCHASE
    SUBSCRIPTION
    REGISTRATION
    LOGIN
    LOGOUT
    ERROR
    CUSTOM
  }

  enum RetentionPeriod {
    DAY_1
    DAY_7
    DAY_30
    DAY_90
    DAY_180
  }

  enum FunnelStage {
    AWARENESS
    CONSIDERATION
    CONVERSION
    RETENTION
    REFERRAL
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input AnalyticsQueryInput {
    period: AnalyticsPeriod!
    startDate: DateTime
    endDate: DateTime
    metrics: [MetricType!]!
    dimensions: [Dimension!]
    filters: [Filter!]
    groupBy: GroupBy
    compareWithPrevious: Boolean
    limit: Int
  }

  input Dimension {
    name: String!
    value: String!
  }

  input Filter {
    field: String!
    operator: FilterOperator!
    value: JSON!
  }

  input ReportInput {
    name: String!
    description: String
    query: AnalyticsQueryInput!
    schedule: ScheduleInput
    recipients: [String!]
    format: ReportFormat
    charts: [ChartConfigInput!]
  }

  input ChartConfigInput {
    type: ChartType!
    title: String!
    description: String
    metrics: [String!]!
    dimensions: [String!]
    options: JSON
  }

  input EventInput {
    type: EventType!
    name: String!
    properties: JSON
    userId: ID
    sessionId: String
    page: String
    referrer: String
    userAgent: String
    ipAddress: String
  }

  input CohortAnalysisInput {
    startDate: DateTime!
    endDate: DateTime!
    period: RetentionPeriod!
    metric: CohortMetric!
    filters: [Filter!]
  }

  input FunnelAnalysisInput {
    stages: [FunnelStageConfig!]!
    startDate: DateTime!
    endDate: DateTime!
    filters: [Filter!]
  }

  enum FilterOperator {
    EQUALS
    NOT_EQUALS
    GREATER_THAN
    LESS_THAN
    GREATER_THAN_EQUALS
    LESS_THAN_EQUALS
    CONTAINS
    NOT_CONTAINS
    STARTS_WITH
    ENDS_WITH
    IN
    NOT_IN
    BETWEEN
  }

  enum ReportFormat {
    PDF
    EXCEL
    CSV
    JSON
    HTML
  }

  enum CohortMetric {
    RETENTION_RATE
    ACTIVITY_RATE
    REVENUE
    ENGAGEMENT
    CONVERSION
  }

  input FunnelStageConfig {
    name: String!
    event: EventType!
    filters: [Filter!]
    timeLimit: Int
  }

  # ==========================================
  # TYPES
  # ==========================================

  type AnalyticsData {
    period: AnalyticsPeriod!
    startDate: DateTime!
    endDate: DateTime!
    
    # Summary Metrics
    summary: SummaryMetrics!
    
    # Detailed Metrics
    metrics: [MetricData!]!
    
    # Trends
    trends: TrendAnalysis!
    
    # Comparisons
    comparison: ComparisonData
    
    # Charts
    charts: [ChartData!]!
    
    # Recommendations
    recommendations: [Recommendation!]!
    
    # Metadata
    generatedAt: DateTime!
    query: JSON!
  }

  type SummaryMetrics {
    # Users
    totalUsers: Int!
    newUsers: Int!
    returningUsers: Int!
    activeUsers: Int!
    
    # Activity
    totalSessions: Int!
    averageSessionDuration: Int!
    pagesPerSession: Float!
    bounceRate: Float!
    
    # Revenue
    totalRevenue: Int!
    averageRevenuePerUser: Float!
    conversionRate: Float!
    
    # Engagement
    totalEngagements: Int!
    engagementRate: Float!
    shares: Int!
    comments: Int!
    
    # Quality
    averageRating: Float!
    satisfactionScore: Float!
    netPromoterScore: Int!
    
    # Growth
    growthRate: Float!
    churnRate: Float!
    viralCoefficient: Float!
  }

  type MetricData {
    type: MetricType!
    name: String!
    value: Float!
    previousValue: Float
    change: Float
    changePercentage: Float
    trend: TrendDirection!
    
    # Breakdown
    breakdown: [BreakdownItem!]
    
    # Timeline
    timeline: [TimelinePoint!]
    
    # Targets
    target: Float
    achieved: Float
    progress: Float
  }

  enum TrendDirection {
    UP
    DOWN
    FLAT
    VOLATILE
  }

  type BreakdownItem {
    dimension: String!
    value: String!
    count: Int!
    percentage: Float!
    change: Float
  }

  type TimelinePoint {
    timestamp: DateTime!
    value: Float!
    label: String
  }

  type TrendAnalysis {
    overallTrend: TrendDirection!
    confidence: Float!
    
    # Seasonal Patterns
    seasonal: Boolean!
    seasonality: Seasonality
    
    # Anomalies
    anomalies: [Anomaly!]
    
    # Forecast
    forecast: ForecastData
    
    # Insights
    insights: [TrendInsight!]!
  }

  type Seasonality {
    pattern: SeasonalPattern!
    period: Int!
    strength: Float!
    peaks: [SeasonalPeak!]!
  }

  enum SeasonalPattern {
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
    CUSTOM
    NONE
  }

  type SeasonalPeak {
    time: String!
    value: Float!
    confidence: Float!
  }

  type Anomaly {
    timestamp: DateTime!
    value: Float!
    expectedValue: Float!
    deviation: Float!
    severity: SeverityLevel!
    cause: String
    action: String
  }

  enum SeverityLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type ForecastData {
    nextPeriod: Float!
    confidenceInterval: ConfidenceInterval!
    accuracy: Float!
    forecastPoints: [ForecastPoint!]!
    assumptions: [String!]!
    risks: [Risk!]!
  }

  type ConfidenceInterval {
    lower: Float!
    upper: Float!
    confidence: Float!
  }

  type ForecastPoint {
    timestamp: DateTime!
    value: Float!
    lowerBound: Float!
    upperBound: Float!
  }

  type Risk {
    type: RiskType!
    probability: Float!
    impact: Float!
    description: String!
    mitigation: String!
  }

  enum RiskType {
    MARKET
    COMPETITIVE
    TECHNICAL
    OPERATIONAL
    REGULATORY
    FINANCIAL
  }

  type TrendInsight {
    type: InsightType!
    title: String!
    description: String!
    impact: Float!
    confidence: Float!
    dataPoints: [DataPoint!]!
    actionItems: [String!]!
  }

  type DataPoint {
    timestamp: DateTime!
    value: Float!
    context: JSON
  }

  type ComparisonData {
    currentPeriod: PeriodData!
    previousPeriod: PeriodData!
    change: ComparisonChange!
    significance: Float!
  }

  type PeriodData {
    startDate: DateTime!
    endDate: DateTime!
    metrics: [MetricComparison!]!
  }

  type MetricComparison {
    name: String!
    currentValue: Float!
    previousValue: Float!
    change: Float!
    changePercentage: Float!
    significance: Float!
  }

  type ComparisonChange {
    improvement: Boolean!
    magnitude: Float!
    significance: Float!
    keyDrivers: [Driver!]!
  }

  type Driver {
    metric: String!
    contribution: Float!
    direction: TrendDirection!
    explanation: String!
  }

  type ChartData {
    id: ID!
    type: ChartType!
    title: String!
    description: String
    
    # Data
    labels: [String!]!
    datasets: [Dataset!]!
    
    # Configuration
    options: JSON!
    
    # Metadata
    generatedAt: DateTime!
  }

  type Dataset {
    label: String!
    data: [Float!]!
    backgroundColor: String
    borderColor: String
    fill: Boolean
    tension: Float
  }

  type Report {
    id: ID!
    name: String!
    description: String
    
    # Configuration
    query: AnalyticsQueryInput!
    charts: [ChartConfig!]!
    
    # Schedule
    schedule: Schedule
    lastRun: DateTime
    nextRun: DateTime
    
    # Delivery
    format: ReportFormat!
    recipients: [String!]!
    deliveryMethod: DeliveryMethod!
    
    # Status
    status: ReportStatus!
    error: String
    
    # Results
    lastResult: AnalyticsData
    history: [ReportRun!]!
    
    # Metadata
    createdBy: User!
    tags: [String!]
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ChartConfig {
    type: ChartType!
    title: String!
    description: String
    metrics: [String!]!
    dimensions: [String!]
    options: JSON
  }

  type Schedule {
    frequency: ScheduleFrequency!
    dayOfWeek: DayOfWeek
    dayOfMonth: Int
    hour: Int
    minute: Int
    timezone: String!
  }

  enum ScheduleFrequency {
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
    HOURLY
    CUSTOM
  }

  enum DeliveryMethod {
    EMAIL
    WEBHOOK
    SLACK
    TEAMS
    API
    DASHBOARD
  }

  enum ReportStatus {
    ACTIVE
    PAUSED
    FAILED
    COMPLETED
  }

  type ReportRun {
    id: ID!
    report: Report!
    startedAt: DateTime!
    completedAt: DateTime!
    duration: Int!
    status: RunStatus!
    error: String
    result: AnalyticsData
    generatedFile: String
    sentTo: [String!]!
  }

  enum RunStatus {
    PENDING
    RUNNING
    COMPLETED
    FAILED
    CANCELLED
  }

  type Event {
    id: ID!
    type: EventType!
    name: String!
    
    # User & Session
    user: User
    sessionId: String!
    
    # Context
    page: String!
    referrer: String
    userAgent: String
    ipAddress: String
    location: LocationData
    
    # Properties
    properties: JSON!
    
    # Timestamps
    timestamp: DateTime!
    receivedAt: DateTime!
  }

  type LocationData {
    country: String
    region: String
    city: String
    latitude: Float
    longitude: Float
    timezone: String
  }

  type Session {
    id: ID!
    user: User
    device: DeviceInfo!
    location: LocationData!
    
    # Activity
    startTime: DateTime!
    endTime: DateTime
    duration: Int!
    pageCount: Int!
    
    # Events
    events: [Event!]!
    
    # Engagement
    engaged: Boolean!
    engagementScore: Float!
    
    # Outcomes
    conversions: Int!
    revenue: Int
    
    # Metadata
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
  }

  type DeviceInfo {
    type: DeviceType!
    brand: String
    model: String
    os: String
    osVersion: String
    browser: String
    browserVersion: String
    screenResolution: String
    language: String
  }

  type CohortAnalysis {
    startDate: DateTime!
    endDate: DateTime!
    period: RetentionPeriod!
    metric: CohortMetric!
    
    # Cohorts
    cohorts: [Cohort!]!
    
    # Summary
    summary: CohortSummary!
    
    # Insights
    insights: [CohortInsight!]!
  }

  type Cohort {
    id: ID!
    startDate: DateTime!
    endDate: DateTime!
    size: Int!
    
    # Retention
    retention: [RetentionPoint!]!
    
    # Metrics
    metrics: CohortMetrics!
    
    # Comparison
    comparison: CohortComparison
  }

  type RetentionPoint {
    period: Int!
    retained: Int!
    retentionRate: Float!
    active: Int!
    activityRate: Float!
    revenue: Int
  }

  type CohortMetrics {
    averageRetention: Float!
    peakRetention: Float!
    churnRate: Float!
    lifetimeValue: Float
    paybackPeriod: Int
  }

  type CohortComparison {
    vsPrevious: Float!
    vsAverage: Float!
    vsBest: Float!
    rank: Int!
  }

  type CohortSummary {
    totalCohorts: Int!
    averageRetention: Float!
    bestCohort: Cohort!
    worstCohort: Cohort!
    trend: TrendDirection!
    improvementRate: Float!
  }

  type CohortInsight {
    cohort: Cohort!
    insight: String!
    recommendation: String!
    impact: Float!
  }

  type FunnelAnalysis {
    stages: [FunnelStage!]!
    startDate: DateTime!
    endDate: DateTime!
    
    # Metrics
    totalEntered: Int!
    totalConverted: Int!
    overallConversionRate: Float!
    averageTimeToConvert: Int!
    
    # Drop-off Analysis
    dropOffs: [DropOff!]!
    
    # Optimization Opportunities
    opportunities: [OptimizationOpportunity!]!
    
    # Predictions
    predictions: FunnelPrediction
  }

  type FunnelStage {
    name: String!
    order: Int!
    entered: Int!
    converted: Int!
    conversionRate: Float!
    dropOffRate: Float!
    averageTime: Int!
    
    # User Details
    users: [FunnelUser!]!
    
    # Patterns
    patterns: [Pattern!]!
  }

  type FunnelUser {
    user: User!
    enteredAt: DateTime!
    convertedAt: DateTime
    timeSpent: Int!
    actions: [String!]!
  }

  type Pattern {
    sequence: [String!]!
    count: Int!
    conversionRate: Float!
    averageTime: Int!
  }

  type DropOff {
    fromStage: String!
    toStage: String!
    count: Int!
    percentage: Float!
    reasons: [DropOffReason!]!
  }

  type DropOffReason {
    reason: String!
    count: Int!
    percentage: Float!
    examples: [String!]!
  }

  type OptimizationOpportunity {
    stage: String!
    metric: String!
    currentValue: Float!
    targetValue: Float!
    improvementPotential: Float!
    actions: [String!]!
    estimatedImpact: Float!
  }

  type FunnelPrediction {
    predictedConversions: Int!
    confidence: Float!
    timeline: [PredictionPoint!]!
    recommendations: [String!]!
  }

  type PredictionPoint {
    date: DateTime!
    conversions: Int!
    lowerBound: Int!
    upperBound: Int!
  }

  type AITest {
    id: ID!
    name: String!
    description: String
    
    # Configuration
    hypothesis: String!
    metrics: [String!]!
    significanceLevel: Float!
    
    # Variations
    variations: [Variation!]!
    
    # Status
    status: TestStatus!
    
    # Results
    results: TestResults
    
    # Timestamps
    startDate: DateTime!
    endDate: DateTime
    createdAt: DateTime!
  }

  type Variation {
    id: ID!
    name: String!
    description: String
    configuration: JSON!
    weight: Float!
    
    # Performance
    participants: Int!
    conversions: Int!
    conversionRate: Float!
    
    # Statistics
    confidence: Float
    pValue: Float
    improvement: Float
  }

  enum TestStatus {
    DRAFT
    RUNNING
    PAUSED
    COMPLETED
    STOPPED
  }

  type TestResults {
    winner: Variation
    confidence: Float!
    significance: Boolean!
    metrics: [MetricResult!]!
    recommendations: [String!]!
    insights: [String!]!
  }

  type MetricResult {
    name: String!
    controlValue: Float!
    variationValue: Float!
    improvement: Float!
    confidence: Float!
    significance: Boolean!
  }

  type Dashboard {
    id: ID!
    name: String!
    description: String
    
    # Layout
    layout: DashboardLayout!
    widgets: [Widget!]!
    
    # Access
    owner: User!
    sharedWith: [User!]!
    public: Boolean!
    
    # Settings
    refreshInterval: Int
    autoRefresh: Boolean
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DashboardLayout {
    type: LayoutType!
    columns: Int!
    rows: Int!
    configuration: JSON!
  }

  enum LayoutType {
    GRID
    FLEX
    CUSTOM
  }

  type Widget {
    id: ID!
    type: WidgetType!
    title: String!
    description: String
    
    # Configuration
    query: AnalyticsQueryInput!
    chartConfig: ChartConfig
    
    # Position
    position: WidgetPosition!
    size: WidgetSize!
    
    # Data
    data: AnalyticsData
    
    # Settings
    refreshable: Boolean!
    editable: Boolean!
    removable: Boolean!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum WidgetType {
    METRIC
    CHART
    TABLE
    HEATMAP
    FUNNEL
    COHORT
    GEO
    TIMELINE
    CUSTOM
  }

  type WidgetPosition {
    x: Int!
    y: Int!
    width: Int!
    height: Int!
  }

  type WidgetSize {
    width: Int!
    height: Int!
    minWidth: Int!
    minHeight: Int!
    maxWidth: Int
    maxHeight: Int
  }

  type RealTimeMetrics {
    # Current Activity
    activeUsers: Int!
    activeSessions: Int!
    eventsPerSecond: Float!
    
    # Recent Events
    recentEvents: [Event!]!
    
    # Live Updates
    updates: [LiveUpdate!]!
    
    # Alerts
    alerts: [Alert!]!
    
    # Generated At
    timestamp: DateTime!
  }

  type LiveUpdate {
    type: UpdateType!
    data: JSON!
    timestamp: DateTime!
  }

  enum UpdateType {
    EVENT
    SESSION_START
    SESSION_END
    CONVERSION
    ERROR
    ALERT
  }

  type Alert {
    id: ID!
    type: AlertType!
    severity: SeverityLevel!
    title: String!
    message: String!
    metric: String!
    threshold: Float!
    currentValue: Float!
    timestamp: DateTime!
    acknowledged: Boolean!
    acknowledgedBy: User
    acknowledgedAt: DateTime
  }

  enum AlertType {
    THRESHOLD_EXCEEDED
    THRESHOLD_BREACHED
    ANOMALY_DETECTED
    ERROR_RATE_HIGH
    PERFORMANCE_DEGRADATION
    AVAABILITY_ISSUE
    SECURITY_ISSUE
    CUSTOM
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Analytics Queries
    analytics(query: AnalyticsQueryInput!): AnalyticsData!
    metric(metric: String!, query: AnalyticsQueryInput!): MetricData!
    compare(query: AnalyticsQueryInput!, compareWith: AnalyticsQueryInput!): ComparisonData!
    
    # Reports
    myReports: [Report!]!
    report(reportId: ID!): Report!
    reportResult(reportId: ID!, runId: ID): AnalyticsData!
    
    # Dashboards
    myDashboards: [Dashboard!]!
    dashboard(dashboardId: ID!): Dashboard!
    publicDashboards: [Dashboard!]!
    
    # Events & Sessions
    events(
      type: EventType
      userId: ID
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): EventConnection!
    
    sessions(
      userId: ID
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): SessionConnection!
    
    session(sessionId: String!): Session!
    
    # Advanced Analytics
    cohortAnalysis(input: CohortAnalysisInput!): CohortAnalysis!
    funnelAnalysis(input: FunnelAnalysisInput!): FunnelAnalysis!
    
    # A/B Testing
    tests(status: TestStatus): [AITest!]!
    test(testId: ID!): AITest!
    
    # Real-time
    realTimeMetrics: RealTimeMetrics!
    liveUpdates: [LiveUpdate!]!
    alerts(
      type: AlertType
      severity: SeverityLevel
      acknowledged: Boolean
      pagination: PaginationInput
    ): [Alert!]!
    
    # Admin
    allReports(
      userId: ID
      status: ReportStatus
      pagination: PaginationInput
    ): ReportConnection!
    
    allDashboards(
      userId: ID
      public: Boolean
      pagination: PaginationInput
    ): DashboardConnection!
    
    analyticsHealth: HealthStatus!
  }

  type EventConnection {
    edges: [EventEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EventEdge {
    node: Event!
    cursor: String!
  }

  type SessionConnection {
    edges: [SessionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SessionEdge {
    node: Session!
    cursor: String!
  }

  type ReportConnection {
    edges: [ReportEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReportEdge {
    node: Report!
    cursor: String!
  }

  type DashboardConnection {
    edges: [DashboardEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DashboardEdge {
    node: Dashboard!
    cursor: String!
  }

  type HealthStatus {
    status: HealthStatusType!
    checks: [HealthCheck!]!
    lastChecked: DateTime!
  }

  enum HealthStatusType {
    HEALTHY
    DEGRADED
    UNHEALTHY
    UNKNOWN
  }

  type HealthCheck {
    component: String!
    status: ComponentStatus!
    latency: Int
    error: String
    lastChecked: DateTime!
  }

  enum ComponentStatus {
    UP
    DOWN
    DEGRADED
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Event Tracking
    trackEvent(input: EventInput!): Event!
    trackBatchEvents(events: [EventInput!]!): [Event!]!
    
    # Reports
    createReport(input: ReportInput!): Report!
    updateReport(reportId: ID!, input: ReportInput!): Report!
    deleteReport(reportId: ID!): MessageResponse!
    runReport(reportId: ID!): ReportRun!
    scheduleReport(reportId: ID!, schedule: ScheduleInput!): Report!
    unscheduleReport(reportId: ID!): Report!
    
    # Dashboards
    createDashboard(name: String!, description: String): Dashboard!
    updateDashboard(dashboardId: ID!, input: DashboardInput!): Dashboard!
    deleteDashboard(dashboardId: ID!): MessageResponse!
    duplicateDashboard(dashboardId: ID!, newName: String!): Dashboard!
    
    # Widgets
    addWidget(dashboardId: ID!, widget: WidgetInput!): Widget!
    updateWidget(widgetId: ID!, input: WidgetUpdateInput!): Widget!
    removeWidget(widgetId: ID!): MessageResponse!
    rearrangeWidgets(dashboardId: ID!, layout: JSON!): Dashboard!
    
    # Sharing
    shareDashboard(dashboardId: ID!, userIds: [ID!]!, permission: PermissionLevel!): Dashboard!
    unshareDashboard(dashboardId: ID!, userIds: [ID!]!): Dashboard!
    makeDashboardPublic(dashboardId: ID!, public: Boolean!): Dashboard!
    
    # A/B Testing
    createTest(input: TestInput!): AITest!
    updateTest(testId: ID!, input: TestUpdateInput!): AITest!
    deleteTest(testId: ID!): MessageResponse!
    startTest(testId: ID!): AITest!
    stopTest(testId: ID!): AITest!
    declareWinner(testId: ID!, variationId: ID!): AITest!
    
    # Alerts
    createAlert(input: AlertInput!): Alert!
    updateAlert(alertId: ID!, input: AlertUpdateInput!): Alert!
    deleteAlert(alertId: ID!): MessageResponse!
    acknowledgeAlert(alertId: ID!): Alert!
    
    # Data Management
    exportData(query: AnalyticsQueryInput!, format: ExportFormat!): String!
    purgeOldData(olderThan: DateTime!): MessageResponse!
    
    # Admin
    recalculateMetrics(metric: String!, startDate: DateTime, endDate: DateTime): MessageResponse!
    rebuildCache: MessageResponse!
    runDiagnostics: HealthStatus!
  }

  input DashboardInput {
    name: String
    description: String
    layout: LayoutInput
    refreshInterval: Int
    autoRefresh: Boolean
    public: Boolean
  }

  input LayoutInput {
    type: LayoutType!
    columns: Int!
    rows: Int!
    configuration: JSON!
  }

  input WidgetInput {
    type: WidgetType!
    title: String!
    description: String
    query: AnalyticsQueryInput!
    chartConfig: ChartConfigInput
    position: WidgetPositionInput!
    size: WidgetSizeInput!
  }

  input WidgetPositionInput {
    x: Int!
    y: Int!
    width: Int!
    height: Int!
  }

  input WidgetSizeInput {
    width: Int!
    height: Int!
    minWidth: Int!
    minHeight: Int!
    maxWidth: Int
    maxHeight: Int
  }

  input WidgetUpdateInput {
    title: String
    description: String
    query: AnalyticsQueryInput
    chartConfig: ChartConfigInput
    position: WidgetPositionInput
    size: WidgetSizeInput
    refreshable: Boolean
    editable: Boolean
    removable: Boolean
  }

  enum PermissionLevel {
    VIEW
    EDIT
    ADMIN
  }

  input TestInput {
    name: String!
    description: String
    hypothesis: String!
    metrics: [String!]!
    significanceLevel: Float!
    variations: [VariationInput!]!
    startDate: DateTime!
    endDate: DateTime
  }

  input VariationInput {
    name: String!
    description: String
    configuration: JSON!
    weight: Float!
  }

  input TestUpdateInput {
    name: String
    description: String
    hypothesis: String
    status: TestStatus
    endDate: DateTime
  }

  input AlertInput {
    type: AlertType!
    metric: String!
    threshold: Float!
    condition: AlertCondition!
    title: String!
    message: String!
    severity: SeverityLevel!
    notificationChannels: [NotificationChannel!]!
    cooldown: Int!
    enabled: Boolean!
  }

  enum AlertCondition {
    GREATER_THAN
    LESS_THAN
    EQUALS
    NOT_EQUALS
    GREATER_THAN_EQUALS
    LESS_THAN_EQUALS
    CHANGED_BY
    OUTSIDE_RANGE
  }

  input AlertUpdateInput {
    enabled: Boolean
    threshold: Float
    condition: AlertCondition
    severity: SeverityLevel
    notificationChannels: [NotificationChannel!]
    cooldown: Int
  }

  enum ExportFormat {
    CSV
    JSON
    EXCEL
    PDF
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    realTimeUpdate: LiveUpdate!
    alertTriggered: Alert!
    metricUpdated(metric: String!): MetricUpdate!
    reportCompleted(reportId: ID!): ReportRun!
  }

  type MetricUpdate {
    metric: String!
    value: Float!
    timestamp: DateTime!
    change: Float
  }
`;

export default analyticsTypeDef;