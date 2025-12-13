// apps/backend/src/graphql/schema/typeDefs/admin/solutionManagement.typeDef.js
import { gql } from 'apollo-server-express';

export const solutionManagementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum SolutionStatus {
    DRAFT
    PENDING_REVIEW
    APPROVED
    REJECTED
    SUSPENDED
    ARCHIVED
    DELETED
  }

  enum SolutionModerationAction {
    APPROVE
    REJECT
    SUSPEND
    UNSUSPEND
    FEATURE
    UNFEATURE
    PIN
    UNPIN
    ARCHIVE
    UNARCHIVE
    DELETE
    RESTORE
    EDIT
    REQUEST_CHANGES
  }

  enum SolutionReportStatus {
    PENDING
    UNDER_REVIEW
    RESOLVED
    DISMISSED
  }

  enum SolutionReportReason {
    PLAGIARISM
    INACCURATE
    OUTDATED
    INAPPROPRIATE
    SPAM
    MALICIOUS
    COPYRIGHT
    PRIVACY
    OTHER
  }

  enum SolutionSortField {
    CREATED_AT
    UPDATED_AT
    VIEWS
    RATING
    DOWNLOADS
    COMMENTS
    REPORTS
  }

  enum ContentType {
    APPLICATION
    DEV_TOOL
    INTEGRATION
    TUTORIAL
    BOUNTY
    TEMPLATE
    LIBRARY
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input SolutionFilterInput {
    # Basic Filters
    search: String
    title: String
    description: String
    
    # Status Filters
    status: SolutionStatus
    isPremium: Boolean
    isFeatured: Boolean
    isPinned: Boolean
    
    # User Filters
    userId: ID
    username: String
    isVerified: Boolean
    subscriptionTier: SubscriptionTier
    
    # Content Filters
    category: String
    subcategory: String
    contentType: ContentType
    techStack: [String!]
    tags: [String!]
    
    # Quality Filters
    minRating: Float
    maxRating: Float
    minViews: Int
    minDownloads: Int
    minComments: Int
    
    # Date Filters
    createdFrom: DateTime
    createdTo: DateTime
    updatedFrom: DateTime
    updatedTo: DateTime
    
    # Moderation Filters
    hasReports: Boolean
    pendingReview: Boolean
    recentlyFlagged: Boolean
    
    # Performance Filters
    minEngagement: Float
    minConversion: Float
  }

  input SolutionModerationInput {
    solutionId: ID!
    action: SolutionModerationAction!
    reason: String
    notes: String
    changes: JSON
    notifyUser: Boolean
    notificationMessage: String
  }

  input SolutionReportInput {
    solutionId: ID!
    reporterId: ID!
    reason: SolutionReportReason!
    description: String!
    evidence: [String!]
    severity: ReportSeverity
  }

  input SolutionEditInput {
    solutionId: ID!
    title: String
    description: String
    category: String
    subcategory: String
    techStack: [String!]
    tags: [String!]
    content: String
    attachments: [String!]
    demoUrl: String
    repositoryUrl: String
    documentationUrl: String
    isPremium: Boolean
    price: Int
    notes: String
  }

  input SolutionBulkActionInput {
    solutionIds: [ID!]!
    action: BulkSolutionAction!
    reason: String
    notes: String
    notifyUsers: Boolean
    notificationTemplate: String
  }

  input CategoryManagementInput {
    name: String!
    description: String
    icon: String
    color: String
    parentCategory: String
    order: Int
    active: Boolean
    requirements: JSON
    restrictions: JSON
  }

  input FeaturedSolutionInput {
    solutionId: ID!
    position: Int
    section: FeaturedSection
    startDate: DateTime
    endDate: DateTime
    notes: String
  }

  enum BulkSolutionAction {
    APPROVE
    REJECT
    SUSPEND
    UNSUSPEND
    FEATURE
    UNFEATURE
    PIN
    UNPIN
    ARCHIVE
    DELETE
    MOVE_CATEGORY
    ADD_TAG
    REMOVE_TAG
    SEND_NOTIFICATION
  }

  enum FeaturedSection {
    HERO
    TRENDING
    NEW
    POPULAR
    PREMIUM
    CATEGORY_TOP
    EDITORS_CHOICE
  }

  # ==========================================
  # TYPES
  # ==========================================

  type SolutionManagementStats {
    # Counts
    totalSolutions: Int!
    newSolutionsToday: Int!
    newSolutionsThisWeek: Int!
    newSolutionsThisMonth: Int!
    
    # Status Breakdown
    draftSolutions: Int!
    pendingReview: Int!
    approvedSolutions: Int!
    rejectedSolutions: Int!
    suspendedSolutions: Int!
    archivedSolutions: Int!
    
    # Quality
    premiumSolutions: Int!
    featuredSolutions: Int!
    pinnedSolutions: Int!
    
    # Reports
    totalReports: Int!
    pendingReports: Int!
    resolvedReports: Int!
    
    # Performance
    averageRating: Float!
    totalViews: Int!
    totalDownloads: Int!
    totalComments: Int!
    
    # Categories
    byCategory: [CategoryStats!]!
    byContentType: [ContentTypeStats!]!
    
    # Growth
    solutionGrowthRate: Float!
    engagementGrowthRate: Float!
    premiumAdoptionRate: Float!
  }

  type SolutionDetail {
    # Solution Info
    solution: Solution!
    
    # Admin Data
    moderationHistory: [SolutionModerationLog!]!
    reports: [SolutionReport!]!
    adminNotes: [AdminNote!]!
    featuredHistory: [FeaturedRecord!]!
    
    # Performance
    analytics: SolutionAnalytics!
    engagement: EngagementMetrics!
    quality: QualityMetrics!
    
    # Relationships
    relatedSolutions: [Solution!]!
    similarSolutions: [Solution!]!
    userSolutions: [Solution!]!
    
    # Risk
    riskScore: Float!
    riskFactors: [RiskFactor!]!
  }

  type SolutionModerationLog {
    id: ID!
    solution: Solution!
    admin: Admin!
    action: SolutionModerationAction!
    
    # Details
    reason: String
    notes: String
    changes: JSON
    ipAddress: String
    userAgent: String
    
    # Notification
    notifiedUser: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type SolutionReport {
    id: ID!
    solution: Solution!
    reporter: User!
    status: SolutionReportStatus!
    
    # Details
    reason: SolutionReportReason!
    description: String!
    evidence: [String!]!
    severity: ReportSeverity!
    
    # Investigation
    assignedTo: Admin
    investigationNotes: String
    investigationDate: DateTime
    
    # Resolution
    actionTaken: SolutionModerationAction
    actionNotes: String
    resolvedAt: DateTime
    resolvedBy: Admin
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminNote {
    id: ID!
    solution: Solution!
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

  type FeaturedRecord {
    id: ID!
    solution: Solution!
    section: FeaturedSection!
    position: Int!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    
    # Performance
    impressions: Int!
    clicks: Int!
    conversionRate: Float!
    
    # Admin
    addedBy: Admin!
    notes: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SolutionAnalytics {
    # Views
    totalViews: Int!
    uniqueViews: Int!
    viewsToday: Int!
    viewsThisWeek: Int!
    viewsThisMonth: Int!
    
    # Engagement
    timeSpent: Int!
    bounceRate: Float!
    scrollDepth: Float!
    
    # Interactions
    likes: Int!
    shares: Int!
    bookmarks: Int!
    downloads: Int!
    
    # Conversion
    premiumUpgrades: Int!
    relatedPurchases: Int!
    affiliateClicks: Int!
    
    # Quality Signals
    ratingCount: Int!
    commentCount: Int!
    reportCount: Int!
    
    # Performance
    loadTime: Int!
    errorRate: Float!
    satisfactionScore: Float!
  }

  type EngagementMetrics {
    # User Engagement
    returningVisitors: Int!
    sessionDuration: Int!
    pagesPerSession: Float!
    
    # Social Engagement
    socialShares: Int!
    referralTraffic: Int!
    backlinks: Int!
    
    # Content Engagement
    completionRate: Float!
    interactionRate: Float!
    feedbackRate: Float!
    
    # Community Engagement
    discussions: Int!
    collaborations: Int!
    forks: Int!
  }

  type QualityMetrics {
    # Technical Quality
    codeQuality: Float!
    documentation: Float!
    performance: Float!
    security: Float!
    
    # Content Quality
    accuracy: Float!
    completeness: Float!
    originality: Float!
    relevance: Float!
    
    # User Quality
    helpfulness: Float!
    clarity: Float!
    organization: Float!
    
    # Overall
    qualityScore: Float!
    trustScore: Float!
    recommendationScore: Float!
  }

  type CategoryStats {
    category: String!
    totalSolutions: Int!
    newSolutions: Int!
    averageRating: Float!
    totalViews: Int!
    premiumCount: Int!
    featuredCount: Int!
  }

  type ContentTypeStats {
    type: ContentType!
    totalSolutions: Int!
    averageRating: Float!
    totalDownloads: Int!
    revenue: Int!
    growthRate: Float!
  }

  type CategoryDetail {
    id: ID!
    name: String!
    description: String
    icon: String
    color: String
    
    # Hierarchy
    parentCategory: CategoryDetail
    subcategories: [CategoryDetail!]!
    depth: Int!
    path: String!
    
    # Stats
    solutionCount: Int!
    premiumCount: Int!
    featuredCount: Int!
    averageRating: Float!
    totalViews: Int!
    
    # Configuration
    order: Int!
    active: Boolean!
    requirements: JSON
    restrictions: JSON
    
    # Moderation
    moderated: Boolean!
    autoApprove: Boolean!
    qualityThreshold: Float!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SolutionBulkActionResult {
    id: ID!
    action: BulkSolutionAction!
    
    # Scope
    totalSolutions: Int!
    processed: Int!
    successful: Int!
    failed: Int!
    
    # Details
    reason: String
    notes: String
    changes: JSON
    
    # Results
    results: [SolutionActionResult!]!
    errors: [BulkActionError!]!
    
    # Status
    status: BulkActionStatus!
    
    # Timestamps
    startedAt: DateTime!
    completedAt: DateTime
    duration: Int
  }

  type SolutionActionResult {
    solutionId: ID!
    success: Boolean!
    message: String
    details: JSON
  }

  type SolutionQueue {
    id: ID!
    type: QueueType!
    
    # Content
    solutions: [Solution!]!
    count: Int!
    estimatedTime: Int!
    
    # Priority
    priority: QueuePriority!
    urgent: Boolean!
    
    # Status
    status: QueueStatus!
    processed: Int!
    remaining: Int!
    
    # Assignment
    assignedTo: [Admin!]!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum QueueType {
    PENDING_REVIEW
    REPORTED
    QUALITY_CHECK
    FEATURED_CANDIDATES
    PREMIUM_UPGRADES
    SUSPENDED_REVIEW
  }

  enum QueuePriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum QueueStatus {
    PENDING
    PROCESSING
    COMPLETED
    PAUSED
    CANCELLED
  }

  type SolutionExport {
    id: ID!
    requestedBy: Admin!
    
    # Configuration
    filter: SolutionFilterInput
    fields: [String!]!
    format: ExportFormat!
    includeContent: Boolean!
    
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

  type SolutionDashboard {
    # Overview
    stats: SolutionManagementStats!
    
    # Queues
    activeQueues: [SolutionQueue!]!
    
    # Recent Activity
    recentModerations: [SolutionModerationLog!]!
    recentReports: [SolutionReport!]!
    recentFeatured: [FeaturedRecord!]!
    
    # Performance
    topPerforming: [SolutionDetail!]!
    mostReported: [SolutionDetail!]!
    trending: [SolutionDetail!]!
    
    # Categories
    categoryPerformance: [CategoryStats!]!
    
    # Generated At
    generatedAt: DateTime!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Solution Management
    solutionManagementStats: SolutionManagementStats!
    solutionDashboard: SolutionDashboard!
    
    solutions(
      filter: SolutionFilterInput
      pagination: PaginationInput
      sort: SolutionSortInput
    ): SolutionConnection!
    
    solutionDetail(solutionId: ID!): SolutionDetail!
    
    # Moderation
    moderationQueue(type: QueueType): SolutionQueue!
    moderationHistory(
      solutionId: ID
      adminId: ID
      action: SolutionModerationAction
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [SolutionModerationLog!]!
    
    # Reports
    solutionReports(
      status: SolutionReportStatus
      reason: SolutionReportReason
      severity: ReportSeverity
      pagination: PaginationInput
    ): SolutionReportConnection!
    
    solutionReport(reportId: ID!): SolutionReport!
    
    # Categories
    categories(active: Boolean): [CategoryDetail!]!
    categoryDetail(categoryId: ID!): CategoryDetail!
    categoryStats(categoryId: ID!): CategoryStats!
    
    # Featured
    featuredSolutions(section: FeaturedSection): [FeaturedRecord!]!
    featuredHistory(
      solutionId: ID
      section: FeaturedSection
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [FeaturedRecord!]!
    
    # Bulk Actions
    bulkActionResults(
      action: BulkSolutionAction
      status: BulkActionStatus
      pagination: PaginationInput
    ): [SolutionBulkActionResult!]!
    
    bulkActionResult(actionId: ID!): SolutionBulkActionResult!
    
    # Exports
    solutionExports(
      status: ExportStatus
      pagination: PaginationInput
    ): [SolutionExport!]!
    
    solutionExport(exportId: ID!): SolutionExport!
    
    # Analytics
    solutionAnalytics(
      solutionId: ID
      startDate: DateTime
      endDate: DateTime
      groupBy: GroupBy
    ): [SolutionAnalytics!]!
    
    # Search
    searchSolutionsAdvanced(
      query: String!
      filter: SolutionFilterInput
      pagination: PaginationInput
    ): SolutionConnection!
  }

  input SolutionSortInput {
    field: SolutionSortField!
    order: SortOrder!
  }

  type SolutionConnection {
    edges: [SolutionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    stats: SolutionManagementStats!
  }

  type SolutionEdge {
    node: Solution!
    cursor: String!
  }

  type SolutionReportConnection {
    edges: [SolutionReportEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SolutionReportEdge {
    node: SolutionReport!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Solution Moderation
    moderateSolution(input: SolutionModerationInput!): SolutionModerationLog!
    editSolution(input: SolutionEditInput!): Solution!
    
    # Status Management
    approveSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    rejectSolution(solutionId: ID!, reason: String!, notifyUser: Boolean): Solution!
    suspendSolution(solutionId: ID!, reason: String!, duration: Int, notifyUser: Boolean): Solution!
    unsuspendSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    archiveSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    unarchiveSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    deleteSolution(solutionId: ID!, reason: String!, permanent: Boolean, notifyUser: Boolean): Solution!
    restoreSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    
    # Premium & Features
    makePremium(solutionId: ID!, price: Int, reason: String, notifyUser: Boolean): Solution!
    removePremium(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    featureSolution(input: FeaturedSolutionInput!): FeaturedRecord!
    unfeatureSolution(featuredId: ID!, reason: String): MessageResponse!
    pinSolution(solutionId: ID!, reason: String, notifyUser: Boolean): Solution!
    unpinSolution(solutionId: ID!, reason: String): Solution!
    
    # Reports
    createSolutionReport(input: SolutionReportInput!): SolutionReport!
    updateReportStatus(reportId: ID!, status: SolutionReportStatus!, notes: String): SolutionReport!
    assignReport(reportId: ID!, adminId: ID!): SolutionReport!
    resolveReport(reportId: ID!, action: SolutionModerationAction!, notes: String): SolutionReport!
    dismissReport(reportId: ID!, reason: String): SolutionReport!
    
    # Notes
    addSolutionNote(solutionId: ID!, title: String!, content: String!, priority: NotePriority, category: NoteCategory): AdminNote!
    updateSolutionNote(noteId: ID!, title: String, content: String, priority: NotePriority, category: NoteCategory): AdminNote!
    resolveSolutionNote(noteId: ID!, resolution: String): AdminNote!
    deleteSolutionNote(noteId: ID!): MessageResponse!
    
    # Bulk Operations
    performBulkSolutionAction(input: SolutionBulkActionInput!): SolutionBulkActionResult!
    cancelBulkAction(actionId: ID!): MessageResponse!
    
    # Categories
    createCategory(input: CategoryManagementInput!): CategoryDetail!
    updateCategory(categoryId: ID!, input: CategoryManagementInput!): CategoryDetail!
    deleteCategory(categoryId: ID!, moveToCategory: String): MessageResponse!
    reorderCategories(order: [CategoryOrderInput!]!): [CategoryDetail!]!
    
    # Queues
    assignToQueue(queueId: ID!, adminId: ID!): SolutionQueue!
    unassignFromQueue(queueId: ID!, adminId: ID!): SolutionQueue!
    processQueueItem(queueId: ID!, solutionId: ID!, action: SolutionModerationAction!, notes: String): SolutionQueue!
    
    # Exports
    exportSolutions(input: SolutionExportInput!): SolutionExport!
    downloadExport(exportId: ID!): String!
    deleteExport(exportId: ID!): MessageResponse!
    
    # Quality Management
    updateQualityScore(solutionId: ID!, score: Float!, reason: String, factors: [QualityFactorInput!]): SolutionDetail!
    requestQualityImprovement(solutionId: ID!, areas: [String!]!, deadline: DateTime, notifyUser: Boolean): MessageResponse!
    
    # Communication
    notifySolutionOwner(solutionId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
    notifyBulkOwners(solutionIds: [ID!]!, subject: String!, message: String!, type: NotificationType): MessageResponse!
  }

  input CategoryOrderInput {
    categoryId: ID!
    order: Int!
  }

  input SolutionExportInput {
    filter: SolutionFilterInput
    fields: [String!]!
    format: ExportFormat
    includeContent: Boolean
  }

  input QualityFactorInput {
    factor: String!
    score: Float!
    reason: String!
    evidence: [String!]
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    solutionModerated: SolutionModerationLog!
    solutionReported: SolutionReport!
    solutionStatusChanged(solutionId: ID!): Solution!
    bulkActionProgress(actionId: ID!): SolutionBulkActionResult!
  }
`;

export default solutionManagementTypeDef;