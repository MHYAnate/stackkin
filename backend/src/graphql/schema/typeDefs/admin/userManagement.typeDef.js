// apps/backend/src/graphql/schema/typeDefs/admin/userManagement.typeDef.js
import { gql } from 'apollo-server-express';

export const userManagementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum UserActionType {
    CREATE
    UPDATE
    DELETE
    SUSPEND
    ACTIVATE
    VERIFY
    UNVERIFY
    PROMOTE
    DEMOTE
    BAN
    WARN
    NOTE
  }

  enum BulkActionType {
    SUSPEND
    ACTIVATE
    VERIFY
    UNVERIFY
    DELETE
    EXPORT
    SEND_EMAIL
    ADD_TAG
    REMOVE_TAG
  }

  enum UserSegment {
    NEW_USERS
    ACTIVE_USERS
    INACTIVE_USERS
    VERIFIED_USERS
    UNVERIFIED_USERS
    PREMIUM_USERS
    FREE_USERS
    SUSPENDED_USERS
    REPORTED_USERS
    HIGH_VALUE_USERS
  }

  enum UserReportStatus {
    PENDING
    UNDER_REVIEW
    RESOLVED
    DISMISSED
    ESCALATED
  }

  enum ReportSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input UserFilterInput {
    # Basic Filters
    search: String
    email: String
    username: String
    firstName: String
    lastName: String
    
    # Status Filters
    accountStatus: AccountStatus
    isVerified: Boolean
    emailVerified: Boolean
    twoFactorEnabled: Boolean
    
    # Role & Subscription
    role: UserRole
    subscriptionTier: SubscriptionTier
    subscriptionStatus: SubscriptionStatus
    
    # Professional Filters
    employmentStatus: EmploymentStatus
    nationality: String
    techStack: [String!]
    minYearsExperience: Int
    maxYearsExperience: Int
    availableForHire: Boolean
    
    # Date Filters
    createdFrom: DateTime
    createdTo: DateTime
    lastLoginFrom: DateTime
    lastLoginTo: DateTime
    lastActiveFrom: DateTime
    lastActiveTo: DateTime
    
    # Activity Filters
    minSolutions: Int
    minJobs: Int
    minListings: Int
    minRating: Float
    maxRating: Float
    
    # Custom Filters
    tags: [String!]
    hasNotes: Boolean
    hasReports: Boolean
  }

  input UserActionInput {
    userId: ID!
    actionType: UserActionType!
    reason: String!
    details: JSON
    notifyUser: Boolean
    notificationMessage: String
  }

  input BulkUserActionInput {
    userIds: [ID!]!
    actionType: BulkActionType!
    reason: String
    details: JSON
    notifyUsers: Boolean
    notificationTemplate: String
  }

  input UpdateUserProfileInput {
    # Basic Info
    firstName: String
    lastName: String
    username: String
    email: String
    
    # Professional Info
    bio: String
    nationality: String
    location: String
    techStack: [String!]
    employmentStatus: EmploymentStatus
    yearsOfExperience: Int
    hourlyRate: Float
    availableForHire: Boolean
    
    # Social Links
    github: String
    linkedin: String
    twitter: String
    website: String
    portfolio: String
    
    # Preferences
    preferredLanguages: [String!]
    timezone: String
    showEmail: Boolean
    showPhone: Boolean
    
    # Account
    role: UserRole
    accountStatus: AccountStatus
    isVerified: Boolean
    verificationStatus: VerificationStatus
    
    # Subscription
    subscriptionTier: SubscriptionTier
    subscriptionStatus: SubscriptionStatus
    subscriptionExpiry: DateTime
    
    # Metadata
    tags: [String!]
    notes: String
  }

  input UserNoteInput {
    userId: ID!
    title: String!
    content: String!
    priority: NotePriority
    category: NoteCategory
  }

  input UserReportInput {
    reporterId: ID!
    reportedUserId: ID!
    reason: String!
    description: String!
    evidence: [String!]
    severity: ReportSeverity
    category: ReportCategory
  }

  input ReportActionInput {
    reportId: ID!
    action: ReportAction!
    notes: String
    penalty: PenaltyInput
    notifyReporter: Boolean
    notifyReported: Boolean
  }

  input PenaltyInput {
    type: PenaltyType!
    duration: Int
    points: Int
    reason: String
  }

  input UserExportInput {
    filter: UserFilterInput
    fields: [String!]!
    format: ExportFormat
    includeSensitive: Boolean
  }

  input UserSegmentInput {
    segment: UserSegment!
    filters: UserFilterInput
    name: String
    description: String
  }

  enum NotePriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum NoteCategory {
    GENERAL
    BEHAVIOR
    PAYMENT
    VERIFICATION
    SUPPORT
    WARNING
    SUSPENSION
    BAN
  }

  enum ReportCategory {
    HARASSMENT
    SPAM
    FRAUD
    IMPERSONATION
    INAPPROPRIATE_CONTENT
    HATE_SPEECH
    SCAM
    PRIVACY_VIOLATION
    COPYRIGHT
    OTHER
  }

  enum ReportAction {
    WARN
    SUSPEND
    BAN
    DELETE_CONTENT
    REQUIRE_VERIFICATION
    NO_ACTION
    DISMISS
    ESCALATE
  }

  enum PenaltyType {
    WARNING
    SUSPENSION
    BAN
    DEMOTION
    CONTENT_REMOVAL
    RESTRICTION
  }

  # ==========================================
  # TYPES
  # ==========================================

  type UserManagementStats {
    # Counts
    totalUsers: Int!
    newUsersToday: Int!
    newUsersThisWeek: Int!
    newUsersThisMonth: Int!
    
    # Status Breakdown
    activeUsers: Int!
    suspendedUsers: Int!
    bannedUsers: Int!
    deactivatedUsers: Int!
    
    # Verification
    verifiedUsers: Int!
    unverifiedUsers: Int!
    pendingVerification: Int!
    
    # Subscription
    freeUsers: Int!
    baseSubscribers: Int!
    midSubscribers: Int!
    topSubscribers: Int!
    
    # Activity
    activeToday: Int!
    activeThisWeek: Int!
    activeThisMonth: Int!
    inactive30Days: Int!
    inactive90Days: Int!
    
    # Reports
    totalReports: Int!
    pendingReports: Int!
    resolvedReports: Int!
    
    # Growth
    userGrowthRate: Float!
    verificationRate: Float!
    subscriptionRate: Float!
  }

  type UserDetail {
    # User Info
    user: User!
    
    # Admin Data
    adminNotes: [UserNote!]!
    adminActions: [UserActionLog!]!
    reports: [UserReport!]!
    tags: [String!]!
    
    # Activity
    loginHistory: [LoginRecord!]!
    ipHistory: [IPRecord!]!
    deviceHistory: [DeviceRecord!]!
    
    # Compliance
    dataRequests: [DataRequest!]!
    consentHistory: [ConsentRecord!]!
    
    # Risk
    riskScore: Float!
    riskFactors: [RiskFactor!]!
    
    # Metrics
    metrics: UserMetrics!
  }

  type UserNote {
    id: ID!
    user: User!
    admin: Admin!
    title: String!
    content: String!
    priority: NotePriority!
    category: NoteCategory!
    
    # Status
    resolved: Boolean!
    resolvedAt: DateTime
    resolvedBy: Admin
    
    # Metadata
    tags: [String!]
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserActionLog {
    id: ID!
    user: User!
    admin: Admin!
    actionType: UserActionType!
    
    # Details
    reason: String!
    details: JSON
    ipAddress: String
    userAgent: String
    
    # Changes
    previousState: JSON
    newState: JSON
    
    # Notification
    notified: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type UserReport {
    id: ID!
    reporter: User!
    reportedUser: User!
    status: UserReportStatus!
    
    # Details
    reason: String!
    description: String!
    evidence: [String!]!
    severity: ReportSeverity!
    category: ReportCategory!
    
    # Investigation
    assignedTo: Admin
    investigationNotes: String
    investigationDate: DateTime
    
    # Resolution
    actionTaken: ReportAction
    actionNotes: String
    penalty: Penalty
    resolvedAt: DateTime
    resolvedBy: Admin
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Penalty {
    type: PenaltyType!
    duration: Int
    startDate: DateTime!
    endDate: DateTime
    points: Int
    reason: String
  }

  type LoginRecord {
    id: ID!
    user: User!
    timestamp: DateTime!
    ipAddress: String!
    userAgent: String!
    location: String
    successful: Boolean!
    failureReason: String
  }

  type IPRecord {
    ipAddress: String!
    firstSeen: DateTime!
    lastSeen: DateTime!
    usageCount: Int!
    locations: [String!]!
    suspicious: Boolean!
    blocked: Boolean!
  }

  type DeviceRecord {
    deviceId: String!
    deviceType: String!
    os: String!
    browser: String!
    firstSeen: DateTime!
    lastSeen: DateTime!
    usageCount: Int!
    trusted: Boolean!
    blocked: Boolean!
  }

  type DataRequest {
    id: ID!
    user: User!
    type: DataRequestType!
    status: RequestStatus!
    
    # Details
    requestDate: DateTime!
    reason: String
    dataProvided: JSON
    
    # Processing
    processedBy: Admin
    processedDate: DateTime
    notes: String
    
    # Delivery
    deliveryMethod: DeliveryMethod
    downloadUrl: String
    expiresAt: DateTime
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum DataRequestType {
    EXPORT_DATA
    DELETE_DATA
    ACCESS_DATA
    CORRECT_DATA
    RESTRICT_PROCESSING
    OBJECT_PROCESSING
    PORTABILITY
  }

  enum RequestStatus {
    PENDING
    PROCESSING
    COMPLETED
    DENIED
    CANCELLED
  }

  type ConsentRecord {
    id: ID!
    user: User!
    consentType: ConsentType!
    granted: Boolean!
    
    # Details
    version: String!
    ipAddress: String!
    userAgent: String!
    
    # Document
    documentUrl: String
    documentVersion: String
    
    # Withdrawal
    withdrawn: Boolean!
    withdrawnAt: DateTime
    withdrawalReason: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum ConsentType {
    TERMS_OF_SERVICE
    PRIVACY_POLICY
    MARKETING_EMAILS
    COOKIES
    DATA_PROCESSING
    THIRD_PARTY_SHARING
    LOCATION
    NOTIFICATIONS
  }

  type RiskFactor {
    factor: String!
    score: Float!
    reason: String!
    evidence: [String!]
    lastUpdated: DateTime!
  }

  type UserMetrics {
    # Activity
    totalLogins: Int!
    failedLogins: Int!
    lastLogin: DateTime!
    daysSinceLastLogin: Int!
    
    # Content
    solutionsCount: Int!
    jobsCount: Int!
    listingsCount: Int!
    ratingsCount: Int!
    messagesCount: Int!
    
    # Engagement
    averageSessionDuration: Int!
    pagesViewed: Int!
    returnRate: Float!
    
    # Financial
    totalSpent: Int!
    totalReceived: Int!
    subscriptionValue: Int!
    
    # Reports
    reportsFiled: Int!
    reportsReceived: Int!
    warningsReceived: Int!
    suspensionsReceived: Int!
    
    # Quality
    averageRating: Float!
    completionRate: Float!
    responseRate: Float!
  }

  type UserSegmentDetail {
    id: ID!
    name: String!
    segment: UserSegment!
    description: String
    
    # Configuration
    filters: UserFilterInput!
    dynamic: Boolean!
    
    # Stats
    userCount: Int!
    lastRefreshed: DateTime!
    refreshFrequency: RefreshFrequency!
    
    # Users
    users: [User!]!
    
    # Usage
    usedInCampaigns: Int!
    lastUsed: DateTime
    
    # Metadata
    tags: [String!]
    createdBy: Admin!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum RefreshFrequency {
    REALTIME
    HOURLY
    DAILY
    WEEKLY
    MONTHLY
    MANUAL
  }

  type BulkActionResult {
    id: ID!
    actionType: BulkActionType!
    
    # Scope
    totalUsers: Int!
    processed: Int!
    successful: Int!
    failed: Int!
    
    # Details
    reason: String
    details: JSON
    
    # Results
    results: [UserActionResult!]!
    errors: [BulkActionError!]!
    
    # Status
    status: BulkActionStatus!
    
    # Timestamps
    startedAt: DateTime!
    completedAt: DateTime
    duration: Int
  }

  type UserActionResult {
    userId: ID!
    success: Boolean!
    message: String
    details: JSON
  }

  type BulkActionError {
    userId: ID!
    error: String!
    details: JSON
  }

  enum BulkActionStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  type UserExport {
    id: ID!
    requestedBy: Admin!
    
    # Configuration
    filter: UserFilterInput
    fields: [String!]!
    format: ExportFormat!
    
    # Status
    status: ExportStatus!
    progress: Float!
    recordCount: Int!
    
    # Output
    fileUrl: String
    fileSize: Int
    checksum: String
    
    # Error
    error: String
    
    # Timestamps
    requestedAt: DateTime!
    startedAt: DateTime
    completedAt: DateTime
    expiresAt: DateTime!
  }

  enum ExportStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  type UserAuditLog {
    id: ID!
    user: User!
    action: String!
    
    # Details
    details: JSON
    ipAddress: String
    userAgent: String
    
    # Changes
    before: JSON
    after: JSON
    
    # Related
    relatedId: ID
    relatedType: String
    
    # Timestamps
    timestamp: DateTime!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # User Management
    userManagementStats: UserManagementStats!
    
    users(
      filter: UserFilterInput
      pagination: PaginationInput
      sort: UserSortInput
    ): UserConnection!
    
    userDetail(userId: ID!): UserDetail!
    
    # Reports
    userReports(
      status: UserReportStatus
      severity: ReportSeverity
      category: ReportCategory
      pagination: PaginationInput
    ): UserReportConnection!
    
    userReport(reportId: ID!): UserReport!
    
    # Notes
    userNotes(
      userId: ID
      priority: NotePriority
      category: NoteCategory
      resolved: Boolean
      pagination: PaginationInput
    ): UserNoteConnection!
    
    # Activity
    userActivity(
      userId: ID!
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): UserAuditLogConnection!
    
    loginHistory(
      userId: ID!
      successful: Boolean
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [LoginRecord!]!
    
    # Segments
    userSegments: [UserSegmentDetail!]!
    userSegment(segmentId: ID!): UserSegmentDetail!
    
    # Bulk Actions
    bulkActionResults(
      actionType: BulkActionType
      status: BulkActionStatus
      pagination: PaginationInput
    ): [BulkActionResult!]!
    
    bulkActionResult(actionId: ID!): BulkActionResult!
    
    # Exports
    userExports(
      status: ExportStatus
      pagination: PaginationInput
    ): [UserExport!]!
    
    userExport(exportId: ID!): UserExport!
    
    # Search
    searchUsersAdvanced(
      query: String!
      filter: UserFilterInput
      pagination: PaginationInput
    ): UserConnection!
  }

  input UserSortInput {
    field: UserSortField!
    order: SortOrder!
  }

  enum UserSortField {
    CREATED_AT
    LAST_LOGIN
    LAST_ACTIVE
    SOLUTIONS_COUNT
    JOBS_COUNT
    LISTINGS_COUNT
    RATING
    REPUTATION
    SUBSCRIPTION_VALUE
    RISK_SCORE
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    stats: UserManagementStats!
  }

  type UserReportConnection {
    edges: [UserReportEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserReportEdge {
    node: UserReport!
    cursor: String!
  }

  type UserNoteConnection {
    edges: [UserNoteEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserNoteEdge {
    node: UserNote!
    cursor: String!
  }

  type UserAuditLogConnection {
    edges: [UserAuditLogEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserAuditLogEdge {
    node: UserAuditLog!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # User Actions
    performUserAction(input: UserActionInput!): UserActionLog!
    updateUserProfile(userId: ID!, input: UpdateUserProfileInput!): User!
    
    # Account Status
    suspendUser(userId: ID!, reason: String!, duration: Int, notify: Boolean): User!
    activateUser(userId: ID!, reason: String, notify: Boolean): User!
    banUser(userId: ID!, reason: String!, permanent: Boolean, notify: Boolean): User!
    unbanUser(userId: ID!, reason: String, notify: Boolean): User!
    deactivateUser(userId: ID!, reason: String, notify: Boolean): User!
    
    # Verification
    verifyUser(userId: ID!, reason: String, notify: Boolean): User!
    unverifyUser(userId: ID!, reason: String!, notify: Boolean): User!
    
    # Role Management
    promoteUser(userId: ID!, role: UserRole!, reason: String, notify: Boolean): User!
    demoteUser(userId: ID!, reason: String!, notify: Boolean): User!
    
    # Notes
    addUserNote(input: UserNoteInput!): UserNote!
    updateUserNote(noteId: ID!, title: String, content: String, priority: NotePriority, category: NoteCategory): UserNote!
    resolveUserNote(noteId: ID!, resolution: String): UserNote!
    deleteUserNote(noteId: ID!): MessageResponse!
    
    # Reports
    createUserReport(input: UserReportInput!): UserReport!
    updateReportStatus(reportId: ID!, status: UserReportStatus!, notes: String): UserReport!
    assignReport(reportId: ID!, adminId: ID!): UserReport!
    takeReportAction(input: ReportActionInput!): UserReport!
    dismissReport(reportId: ID!, reason: String): UserReport!
    escalateReport(reportId: ID!, reason: String!, toRole: AdminRole): UserReport!
    
    # Bulk Operations
    performBulkAction(input: BulkUserActionInput!): BulkActionResult!
    cancelBulkAction(actionId: ID!): MessageResponse!
    
    # Segments
    createUserSegment(input: UserSegmentInput!): UserSegmentDetail!
    updateUserSegment(segmentId: ID!, input: UserSegmentInput!): UserSegmentDetail!
    deleteUserSegment(segmentId: ID!): MessageResponse!
    refreshUserSegment(segmentId: ID!): UserSegmentDetail!
    
    # Exports
    exportUsers(input: UserExportInput!): UserExport!
    downloadExport(exportId: ID!): String!
    deleteExport(exportId: ID!): MessageResponse!
    
    # Data Requests
    processDataRequest(requestId: ID!, approve: Boolean!, notes: String): DataRequest!
    updateConsent(userId: ID!, consentType: ConsentType!, granted: Boolean!, reason: String): ConsentRecord!
    
    # Risk Management
    updateRiskScore(userId: ID!, score: Float!, reason: String, factors: [RiskFactorInput!]): UserDetail!
    flagSuspiciousActivity(userId: ID!, reason: String!, evidence: [String!]): UserDetail!
    
    # Communication
    sendUserNotification(userId: ID!, title: String!, message: String!, type: NotificationType, urgent: Boolean): MessageResponse!
    sendBulkNotification(userIds: [ID!]!, title: String!, message: String!, type: NotificationType): MessageResponse!
  }

  input RiskFactorInput {
    factor: String!
    score: Float!
    reason: String!
    evidence: [String!]
  }

  enum NotificationType {
    INFO
    WARNING
    ALERT
    UPDATE
    ANNOUNCEMENT
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    userActionPerformed: UserActionLog!
    userReportCreated: UserReport!
    userStatusChanged(userId: ID!): User!
    bulkActionProgress(actionId: ID!): BulkActionResult!
  }
`;

export default userManagementTypeDef;