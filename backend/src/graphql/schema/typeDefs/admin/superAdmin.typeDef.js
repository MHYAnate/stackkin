// apps/backend/src/graphql/schema/typeDefs/admin/superAdmin.typeDef.js
import { gql } from 'apollo-server-express';

export const superAdminTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum AdminRole {
    SUPER_ADMIN
    USER_MANAGEMENT_ADMIN
    SOLUTIONS_MANAGEMENT_ADMIN
    JOB_BOARD_ADMIN
    MARKETPLACE_ADMIN
    CHAT_ADMIN
    VERIFICATION_ADMIN
    SUBSCRIPTION_ADMIN
    EMAIL_ADMIN
    ADVERTISING_ADMIN
    ANALYTICS_ADMIN
    SECURITY_ADMIN
  }

  enum AdminStatus {
    ACTIVE
    SUSPENDED
    INACTIVE
    PENDING
  }

  enum PlatformFeature {
    REGISTRATION
    EMAIL_VERIFICATION
    TWO_FACTOR
    RATE_LIMITING
    PAYMENTS
    SUBSCRIPTIONS
    MARKETPLACE
    CHAT
    VERIFICATION
    ANALYTICS
    ADVERTISING
    API_ACCESS
    MAINTENANCE_MODE
  }

  enum PlatformStatus {
    OPERATIONAL
    MAINTENANCE
    DEGRADED
    OFFLINE
    TESTING
  }

  enum SystemLogLevel {
    DEBUG
    INFO
    WARN
    ERROR
    CRITICAL
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateAdminInput {
    email: String!
    firstName: String!
    lastName: String!
    role: AdminRole!
    permissions: [String!]
    notes: String
  }

  input UpdateAdminInput {
    firstName: String
    lastName: String
    role: AdminRole
    permissions: [String!]
    status: AdminStatus
    notes: String
  }

  input AdminFilterInput {
    role: AdminRole
    status: AdminStatus
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  input PlatformSettingsInput {
    # General
    platformName: String
    platformTagline: String
    supportEmail: String
    contactEmail: String
    baseUrl: String
    frontendUrl: String
    
    # Features
    enabledFeatures: [PlatformFeature!]
    maintenanceMode: Boolean
    maintenanceMessage: String
    registrationEnabled: Boolean
    emailVerificationRequired: Boolean
    twoFactorRequired: Boolean
    
    # Limits
    maxFileSize: Int
    maxUsers: Int
    maxSolutionsPerUser: Int
    maxJobsPerUser: Int
    maxListingsPerUser: Int
    
    # Performance
    cacheTtl: CacheTtlInput
    rateLimiting: RateLimitingInput
    sessionDuration: Int
    
    # Security
    passwordMinLength: Int
    passwordRequiresSpecial: Boolean
    passwordRequiresNumber: Boolean
    passwordRequiresUppercase: Boolean
    maxLoginAttempts: Int
    accountLockoutDuration: Int
    
    # Email
    emailConfig: EmailConfigInput
    notificationDefaults: NotificationDefaultsInput
    
    # Payment
    paymentConfig: PaymentConfigInput
    subscriptionConfig: SubscriptionConfigInput
    
    # Analytics
    analyticsConfig: AnalyticsConfigInput
    trackingEnabled: Boolean
  }

  input CacheTtlInput {
    short: Int
    medium: Int
    long: Int
    session: Int
  }

  input RateLimitingInput {
    enabled: Boolean
    windowMs: Int
    maxRequests: Int
    skipSuccessful: Boolean
  }

  input EmailConfigInput {
    provider: String
    apiKey: String
    fromEmail: String
    fromName: String
    replyTo: String
    templates: EmailTemplatesInput
  }

  input EmailTemplatesInput {
    welcome: String
    verification: String
    passwordReset: String
    paymentReceipt: String
    subscription: String
    securityAlert: String
  }

  input NotificationDefaultsInput {
    defaultEmailFrequency: EmailFrequency
    defaultPushEnabled: Boolean
    defaultSmsEnabled: Boolean
  }

  input PaymentConfigInput {
    defaultCurrency: Currency
    paymentProviders: [String!]
    defaultProvider: String
    transactionFee: Float
    minWithdrawalAmount: Int
    maxWithdrawalAmount: Int
    autoWithdrawal: Boolean
  }

  input SubscriptionConfigInput {
    tiers: [SubscriptionTierConfigInput!]
    prorationEnabled: Boolean
    gracePeriod: Int
    trialPeriod: Int
  }

  input SubscriptionTierConfigInput {
    tier: SubscriptionTier!
    priceYearly: Int!
    priceHalfYearly: Int
    priceLifetime: Int
    features: [String!]!
    limits: JSON!
  }

  input AnalyticsConfigInput {
    retentionDays: Int
    eventTracking: Boolean
    userTracking: Boolean
    performanceTracking: Boolean
    errorTracking: Boolean
  }

  input SystemBackupInput {
    name: String!
    description: String
    includeData: Boolean
    includeMedia: Boolean
    includeLogs: Boolean
    scheduled: Boolean
    schedule: ScheduleInput
  }

  input ApiKeyInput {
    name: String!
    description: String
    permissions: [String!]!
    expiresAt: DateTime
    rateLimit: Int
    ipWhitelist: [String!]
  }

  input SystemHealthCheckInput {
    components: [HealthCheckComponent!]
    detailed: Boolean
  }

  enum HealthCheckComponent {
    DATABASE
    REDIS
    CLOUDINARY
    EMAIL
    PAYMENT
    SOCKET
    API
    CACHE
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Admin {
    id: ID!
    user: User!
    role: AdminRole!
    status: AdminStatus!
    
    # Permissions
    permissions: [String!]!
    scope: AdminScope!
    
    # Activity
    lastLoginAt: DateTime
    lastActivityAt: DateTime
    loginCount: Int!
    
    # Metadata
    notes: String
    createdBy: Admin
    
    # Audit
    auditLogs: [AuditLog!]!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminScope {
    # Module Access
    canManageUsers: Boolean!
    canManageSolutions: Boolean!
    canManageJobs: Boolean!
    canManageMarketplace: Boolean!
    canManageChat: Boolean!
    canManageVerification: Boolean!
    canManageSubscriptions: Boolean!
    canManageEmail: Boolean!
    canManageAdvertising: Boolean!
    canManageAnalytics: Boolean!
    canManageSecurity: Boolean!
    
    # Actions
    canCreate: Boolean!
    canRead: Boolean!
    canUpdate: Boolean!
    canDelete: Boolean!
    canApprove: Boolean!
    canReject: Boolean!
    canSuspend: Boolean!
    canBan: Boolean!
    canRefund: Boolean!
    canExport: Boolean!
    canImport: Boolean!
    
    # Limits
    dailyLimit: Int
    monthlyLimit: Int
    maxRecords: Int
    
    # Restrictions
    restrictions: [String!]
  }

  type PlatformSettings {
    # General
    platformName: String!
    platformTagline: String!
    supportEmail: String!
    contactEmail: String!
    baseUrl: String!
    frontendUrl: String!
    
    # Features
    enabledFeatures: [PlatformFeature!]!
    maintenanceMode: Boolean!
    maintenanceMessage: String
    registrationEnabled: Boolean!
    emailVerificationRequired: Boolean!
    twoFactorRequired: Boolean!
    
    # Limits
    maxFileSize: Int!
    maxUsers: Int
    maxSolutionsPerUser: Int
    maxJobsPerUser: Int
    maxListingsPerUser: Int
    
    # Performance
    cacheTtl: CacheTtl!
    rateLimiting: RateLimiting!
    sessionDuration: Int!
    
    # Security
    passwordMinLength: Int!
    passwordRequiresSpecial: Boolean!
    passwordRequiresNumber: Boolean!
    passwordRequiresUppercase: Boolean!
    maxLoginAttempts: Int!
    accountLockoutDuration: Int!
    
    # Email
    emailConfig: EmailConfig!
    notificationDefaults: NotificationDefaults!
    
    # Payment
    paymentConfig: PaymentConfig!
    subscriptionConfig: SubscriptionConfig!
    
    # Analytics
    analyticsConfig: AnalyticsConfig!
    trackingEnabled: Boolean!
    
    # Timestamps
    updatedAt: DateTime!
    updatedBy: Admin!
  }

  type CacheTtl {
    short: Int!
    medium: Int!
    long: Int!
    session: Int!
  }

  type RateLimiting {
    enabled: Boolean!
    windowMs: Int!
    maxRequests: Int!
    skipSuccessful: Boolean!
  }

  type EmailConfig {
    provider: String!
    apiKey: String
    fromEmail: String!
    fromName: String!
    replyTo: String!
    templates: EmailTemplates!
  }

  type EmailTemplates {
    welcome: String!
    verification: String!
    passwordReset: String!
    paymentReceipt: String!
    subscription: String!
    securityAlert: String!
  }

  type NotificationDefaults {
    defaultEmailFrequency: EmailFrequency!
    defaultPushEnabled: Boolean!
    defaultSmsEnabled: Boolean!
  }

  type PaymentConfig {
    defaultCurrency: Currency!
    paymentProviders: [String!]!
    defaultProvider: String!
    transactionFee: Float!
    minWithdrawalAmount: Int!
    maxWithdrawalAmount: Int!
    autoWithdrawal: Boolean!
  }

  type SubscriptionConfig {
    tiers: [SubscriptionTierConfig!]!
    prorationEnabled: Boolean!
    gracePeriod: Int!
    trialPeriod: Int!
  }

  type SubscriptionTierConfig {
    tier: SubscriptionTier!
    priceYearly: Int!
    priceHalfYearly: Int
    priceLifetime: Int
    features: [String!]!
    limits: JSON!
  }

  type AnalyticsConfig {
    retentionDays: Int!
    eventTracking: Boolean!
    userTracking: Boolean!
    performanceTracking: Boolean!
    errorTracking: Boolean!
  }

  type SystemBackup {
    id: ID!
    name: String!
    description: String
    
    # Content
    includesData: Boolean!
    includesMedia: Boolean!
    includesLogs: Boolean!
    
    # Status
    status: BackupStatus!
    size: Int!
    
    # Storage
    storagePath: String!
    downloadUrl: String
    checksum: String!
    
    # Schedule
    scheduled: Boolean!
    schedule: Schedule
    
    # Metadata
    createdBy: Admin!
    notes: String
    
    # Timestamps
    createdAt: DateTime!
    completedAt: DateTime
  }

  enum BackupStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  type ApiKey {
    id: ID!
    name: String!
    description: String
    
    # Key
    key: String!
    prefix: String!
    lastUsed: DateTime
    
    # Permissions
    permissions: [String!]!
    rateLimit: Int!
    ipWhitelist: [String!]
    
    # Status
    active: Boolean!
    expiresAt: DateTime
    
    # Usage
    usageCount: Int!
    lastUsedAt: DateTime
    lastUsedIp: String
    lastUsedUserAgent: String
    
    # Timestamps
    createdAt: DateTime!
    createdBy: Admin!
    updatedAt: DateTime!
  }

  type SystemHealth {
    status: SystemHealthStatus!
    uptime: Float!
    responseTime: Int!
    
    # Components
    components: [HealthComponent!]!
    
    # Metrics
    metrics: SystemMetrics!
    
    # Alerts
    activeAlerts: [SystemAlert!]!
    
    # Recommendations
    recommendations: [Recommendation!]!
    
    # Timestamp
    checkedAt: DateTime!
  }

  enum SystemHealthStatus {
    HEALTHY
    DEGRADED
    UNHEALTHY
    MAINTENANCE
  }

  type HealthComponent {
    name: String!
    status: ComponentStatus!
    latency: Int
    lastChecked: DateTime!
    details: JSON
  }

  enum ComponentStatus {
    OPERATIONAL
    DEGRADED
    DOWN
    MAINTENANCE
  }

  type SystemMetrics {
    # Performance
    cpuUsage: Float!
    memoryUsage: Float!
    diskUsage: Float!
    networkUsage: Float!
    
    # Application
    activeConnections: Int!
    requestRate: Float!
    errorRate: Float!
    responseTime: Int!
    
    # Database
    dbConnections: Int!
    dbQueriesPerSecond: Float!
    dbSize: Int!
    
    # Cache
    cacheHitRate: Float!
    cacheSize: Int!
    cacheEvictions: Int!
  }

  type SystemAlert {
    id: ID!
    type: SystemAlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    component: String!
    
    # Metrics
    currentValue: Float!
    threshold: Float!
    
    # Status
    acknowledged: Boolean!
    acknowledgedBy: Admin
    acknowledgedAt: DateTime
    
    # Timestamps
    triggeredAt: DateTime!
    resolvedAt: DateTime
  }

  enum SystemAlertType {
    HIGH_CPU
    HIGH_MEMORY
    HIGH_DISK
    HIGH_NETWORK
    HIGH_ERROR_RATE
    LOW_CACHE_HIT
    DB_CONNECTION_HIGH
    DB_SLOW_QUERIES
    API_RATE_LIMIT
    SECURITY_BREACH
    CERTIFICATE_EXPIRY
    BACKUP_FAILED
    PAYMENT_FAILURE
    EMAIL_FAILURE
  }

  enum AlertSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type SystemLog {
    id: ID!
    level: SystemLogLevel!
    message: String!
    context: JSON
    
    # Source
    component: String!
    userId: ID
    adminId: ID
    ipAddress: String
    userAgent: String
    
    # Metadata
    traceId: String
    spanId: String
    
    # Timestamps
    timestamp: DateTime!
  }

  type PlatformStats {
    # Users
    totalUsers: Int!
    newUsersToday: Int!
    activeUsersToday: Int!
    verifiedUsers: Int!
    
    # Content
    totalSolutions: Int!
    newSolutionsToday: Int!
    totalJobs: Int!
    newJobsToday: Int!
    totalListings: Int!
    newListingsToday: Int!
    
    # Activity
    totalChatMessages: Int!
    newChatMessagesToday: Int!
    totalRatings: Int!
    newRatingsToday: Int!
    
    # Financial
    totalRevenue: Int!
    revenueToday: Int!
    totalTransactions: Int!
    transactionsToday: Int!
    
    # Performance
    averageResponseTime: Int!
    errorRate: Float!
    uptime: Float!
    
    # Growth
    userGrowthRate: Float!
    revenueGrowthRate: Float!
    activityGrowthRate: Float!
  }

  type AdminDashboard {
    # Overview
    platformStats: PlatformStats!
    systemHealth: SystemHealth!
    
    # Recent Activity
    recentAdmins: [AdminActivity!]!
    recentUsers: [UserActivity!]!
    recentTransactions: [TransactionActivity!]!
    
    # Alerts
    activeAlerts: [SystemAlert!]!
    
    # Performance
    performanceMetrics: PerformanceMetrics!
    
    # Generated At
    generatedAt: DateTime!
  }

  type AdminActivity {
    admin: Admin!
    action: String!
    details: JSON
    timestamp: DateTime!
  }

  type UserActivity {
    user: User!
    action: String!
    details: JSON
    timestamp: DateTime!
  }

  type TransactionActivity {
    transaction: Transaction!
    amount: Int!
    type: String!
    timestamp: DateTime!
  }

  type PerformanceMetrics {
    # API Performance
    apiRequests: Int!
    apiErrors: Int!
    apiLatency: Int!
    
    # Database Performance
    dbQueries: Int!
    dbSlowQueries: Int!
    dbLatency: Int!
    
    # Cache Performance
    cacheHits: Int!
    cacheMisses: Int!
    cacheLatency: Int!
    
    # External Services
    paymentSuccessRate: Float!
    emailSuccessRate: Float!
    fileUploadSuccessRate: Float!
  }

  type SystemDiagnostic {
    id: ID!
    name: String!
    status: DiagnosticStatus!
    
    # Tests
    tests: [DiagnosticTest!]!
    
    # Results
    passed: Int!
    failed: Int!
    warnings: Int!
    
    # Details
    details: JSON
    recommendations: [String!]!
    
    # Timestamps
    startedAt: DateTime!
    completedAt: DateTime!
    duration: Int!
  }

  enum DiagnosticStatus {
    PASSED
    FAILED
    WARNING
    RUNNING
  }

  type DiagnosticTest {
    name: String!
    description: String!
    status: TestStatus!
    message: String
    details: JSON
    duration: Int
  }

  enum TestStatus {
    PASSED
    FAILED
    SKIPPED
    TIMEOUT
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Admin Management
    allAdmins(
      filter: AdminFilterInput
      pagination: PaginationInput
    ): AdminConnection!
    
    admin(adminId: ID!): Admin!
    adminByUserId(userId: ID!): Admin!
    
    # Platform Settings
    platformSettings: PlatformSettings!
    platformStats: PlatformStats!
    
    # System Health
    systemHealth(input: SystemHealthCheckInput): SystemHealth!
    systemMetrics: SystemMetrics!
    
    # Backups
    systemBackups: [SystemBackup!]!
    backupDetails(backupId: ID!): SystemBackup!
    
    # API Keys
    apiKeys: [ApiKey!]!
    apiKey(keyId: ID!): ApiKey!
    
    # Logs
    systemLogs(
      level: SystemLogLevel
      component: String
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): SystemLogConnection!
    
    # Dashboard
    adminDashboard: AdminDashboard!
    
    # Diagnostics
    runDiagnostic(name: String): SystemDiagnostic!
    diagnosticHistory(pagination: PaginationInput): [SystemDiagnostic!]!
  }

  type AdminConnection {
    edges: [AdminEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AdminEdge {
    node: Admin!
    cursor: String!
  }

  type SystemLogConnection {
    edges: [SystemLogEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SystemLogEdge {
    node: SystemLog!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Admin Management
    createAdmin(input: CreateAdminInput!): Admin!
    updateAdmin(adminId: ID!, input: UpdateAdminInput!): Admin!
    deleteAdmin(adminId: ID!): MessageResponse!
    suspendAdmin(adminId: ID!, reason: String!): Admin!
    activateAdmin(adminId: ID!): Admin!
    
    # Platform Settings
    updatePlatformSettings(input: PlatformSettingsInput!): PlatformSettings!
    resetPlatformSettings: PlatformSettings!
    toggleFeature(feature: PlatformFeature!, enabled: Boolean!): PlatformSettings!
    
    # Maintenance
    enableMaintenanceMode(message: String): PlatformSettings!
    disableMaintenanceMode: PlatformSettings!
    
    # Backups
    createBackup(input: SystemBackupInput!): SystemBackup!
    restoreBackup(backupId: ID!): MessageResponse!
    deleteBackup(backupId: ID!): MessageResponse!
    downloadBackup(backupId: ID!): String!
    
    # API Keys
    createApiKey(input: ApiKeyInput!): ApiKey!
    updateApiKey(keyId: ID!, input: ApiKeyInput!): ApiKey!
    revokeApiKey(keyId: ID!): MessageResponse!
    regenerateApiKey(keyId: ID!): ApiKey!
    
    # System Operations
    clearCache(cacheType: CacheType): MessageResponse!
    restartService(service: ServiceType): MessageResponse!
    runGarbageCollection: MessageResponse!
    
    # Logs
    exportLogs(
      level: SystemLogLevel
      startDate: DateTime
      endDate: DateTime
      format: ExportFormat
    ): String!
    clearOldLogs(olderThan: DateTime!): MessageResponse!
    
    # Alerts
    acknowledgeAlert(alertId: ID!): SystemAlert!
    resolveAlert(alertId: ID!): SystemAlert!
    createAlert(input: SystemAlertInput!): SystemAlert!
    
    # Emergency
    emergencyShutdown(reason: String!): MessageResponse!
    emergencyRestart(reason: String!): MessageResponse!
  }

  enum CacheType {
    ALL
    REDIS
    MEMORY
    DATABASE
    FILESYSTEM
  }

  enum ServiceType {
    API
    WEBSOCKET
    EMAIL
    PAYMENT
    BACKGROUND_JOBS
    ALL
  }

  input SystemAlertInput {
    type: SystemAlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    component: String!
    currentValue: Float!
    threshold: Float!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    systemAlertTriggered: SystemAlert!
    systemHealthUpdated: SystemHealth!
    adminActivity: AdminActivity!
    platformStatsUpdated: PlatformStats!
  }
`;

export default superAdminTypeDef;