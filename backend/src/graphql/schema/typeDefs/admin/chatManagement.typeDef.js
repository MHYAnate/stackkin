// apps/backend/src/graphql/schema/typeDefs/admin/chatManagement.typeDef.js
import { gql } from 'apollo-server-express';

export const chatManagementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum RoomType {
    GENERAL
    COUNTRY
    LANGUAGE
    CATEGORY
    PREMIUM
    SQUAD
    DIRECT
    ANNOUNCEMENT
    COLLABORATION
    SUPPORT
  }

  enum RoomStatus {
    ACTIVE
    ARCHIVED
    SUSPENDED
    HIDDEN
    PRIVATE
    LOCKED
  }

  enum MessageStatus {
    SENT
    DELIVERED
    READ
    EDITED
    DELETED
    FLAGGED
    MODERATED
  }

  enum ModerationAction {
    WARN
    MUTE
    KICK
    BAN
    DELETE_MESSAGE
    DELETE_ALL_MESSAGES
    RESTRICT
    SUSPEND
    NOTE
  }

  enum ReportStatus {
    PENDING
    UNDER_REVIEW
    RESOLVED
    DISMISSED
    ESCALATED
  }

  enum AnnouncementType {
    GLOBAL
    ROOM
    USER
    SYSTEM
    PROMOTIONAL
    SECURITY
    MAINTENANCE
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input ChatFilterInput {
    # Room Filters
    roomType: RoomType
    roomStatus: RoomStatus
    roomId: ID
    roomName: String
    
    # User Filters
    userId: ID
    username: String
    userRole: UserRole
    userStatus: AccountStatus
    
    # Message Filters
    messageContains: String
    flagged: Boolean
    moderated: Boolean
    deleted: Boolean
    
    # Date Filters
    startDate: DateTime
    endDate: DateTime
    lastMessageFrom: DateTime
    lastMessageTo: DateTime
    
    # Activity Filters
    minMessages: Int
    minUsers: Int
    active: Boolean
    archived: Boolean
  }

  input MessageFilterInput {
    roomId: ID
    userId: ID
    status: MessageStatus
    flagged: Boolean
    moderated: Boolean
    deleted: Boolean
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  input RoomManagementInput {
    roomId: ID!
    action: RoomAction!
    reason: String
    duration: Int
    changes: JSON
    notifyUsers: Boolean
    notificationMessage: String
  }

  input MessageModerationInput {
    messageId: ID!
    action: ModerationAction!
    reason: String
    notes: String
    notifyUser: Boolean
    notificationMessage: String
  }

  input UserModerationInput {
    userId: ID!
    roomId: ID!
    action: ModerationAction!
    reason: String!
    duration: Int
    notes: String
    notifyUser: Boolean
    notificationMessage: String
  }

  input ReportActionInput {
    reportId: ID!
    action: ReportAction!
    penalty: PenaltyInput
    notes: String
    notifyReporter: Boolean
    notifyReported: Boolean
  }

  input AnnouncementInput {
    type: AnnouncementType!
    title: String!
    content: String!
    rooms: [ID!]
    users: [ID!]
    priority: AnnouncementPriority!
    startDate: DateTime!
    endDate: DateTime
    active: Boolean!
  }

  enum RoomAction {
    ARCHIVE
    UNARCHIVE
    SUSPEND
    UNSUSPEND
    HIDE
    UNHIDE
    LOCK
    UNLOCK
    RENAME
    RECONFIGURE
    DELETE
    CLEAR
  }

  enum ReportAction {
    WARN
    MUTE
    KICK
    BAN
    DELETE_CONTENT
    NO_ACTION
    DISMISS
    ESCALATE
  }

  enum AnnouncementPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  # ==========================================
  # TYPES
  # ==========================================

  type ChatManagementStats {
    # Rooms
    totalRooms: Int!
    activeRooms: Int!
    archivedRooms: Int!
    suspendedRooms: Int!
    
    # Messages
    totalMessages: Int!
    messagesToday: Int!
    messagesThisWeek: Int!
    messagesThisMonth: Int!
    
    # Users
    activeUsers: Int!
    mutedUsers: Int!
    bannedUsers: Int!
    
    # Reports
    totalReports: Int!
    pendingReports: Int!
    resolvedReports: Int!
    
    # Moderation
    moderatedMessages: Int!
    deletedMessages: Int!
    warningsIssued: Int!
    
    # Activity
    peakConcurrency: Int!
    averageMessagesPerUser: Float!
    averageSessionDuration: Int!
    
    # Quality
    reportRate: Float!
    moderationRate: Float!
    satisfactionScore: Float!
  }

  type RoomDetail {
    # Room Info
    room: ChatRoom!
    
    # Admin Data
    moderationHistory: [RoomModerationLog!]!
    configuration: RoomConfiguration!
    announcements: [Announcement!]!
    
    # Activity
    activityStats: RoomActivity!
    userStats: RoomUserStats!
    messageStats: MessageStats!
    
    # Moderation
    bannedUsers: [User!]!
    mutedUsers: [User!]!
    warnings: [Warning!]!
    
    # Reports
    reports: [ChatReport!]!
    
    # Related Rooms
    similarRooms: [ChatRoom!]!
    relatedRooms: [ChatRoom!]!
  }

  type RoomModerationLog {
    id: ID!
    room: ChatRoom!
    admin: Admin!
    action: RoomAction!
    
    # Details
    reason: String
    duration: Int
    changes: JSON
    ipAddress: String
    userAgent: String
    
    # Impact
    affectedUsers: Int
    deletedMessages: Int
    
    # Notification
    notifiedUsers: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type RoomConfiguration {
    id: ID!
    room: ChatRoom!
    
    # Settings
    type: RoomType!
    status: RoomStatus!
    maxUsers: Int
    messageRateLimit: Int
    joinPermissions: JoinPermissions!
    messagePermissions: MessagePermissions!
    moderationSettings: ModerationSettings!
    
    # Content
    description: String
    rules: [String!]
    tags: [String!]
    pinnedMessages: [Message!]
    
    # Automation
    autoModeration: Boolean!
    wordFilter: [String!]
    linkFilter: Boolean
    imageFilter: Boolean
    spamFilter: Boolean
    
    # Timestamps
    updatedAt: DateTime!
    updatedBy: Admin!
  }

  type JoinPermissions {
    open: Boolean!
    requireInvite: Boolean!
    requireApproval: Boolean!
    requireSubscription: Boolean!
    allowedRoles: [UserRole!]
    allowedCountries: [String!]
    allowedLanguages: [String!]
    blacklistedUsers: [ID!]
  }

  type MessagePermissions {
    canSend: Boolean!
    canEdit: Boolean!
    canDelete: Boolean!
    canPin: Boolean!
    canAnnounce: Boolean!
    canInvite: Boolean!
    canModerate: Boolean!
    rateLimit: Int
    characterLimit: Int
    attachmentLimit: Int
  }

  type ModerationSettings {
    autoFlag: Boolean!
    autoDelete: Boolean!
    requireApproval: Boolean!
    moderationQueue: Boolean!
    reportThreshold: Int
    warnThreshold: Int
    muteThreshold: Int
    banThreshold: Int
  }

  type RoomActivity {
    # Messages
    totalMessages: Int!
    messagesToday: Int!
    messagesThisWeek: Int!
    messagesThisMonth: Int!
    
    # Users
    totalUsers: Int!
    activeUsers: Int!
    newUsersToday: Int!
    
    # Engagement
    averageMessagesPerUser: Float!
    averageSessionDuration: Int!
    peakConcurrency: Int!
    
    # Time Analysis
    busiestHour: Int!
    busiestDay: String!
    activityTrend: [ActivityPoint!]!
  }

  type ActivityPoint {
    timestamp: DateTime!
    messages: Int!
    users: Int!
    concurrency: Int!
  }

  type RoomUserStats {
    # Counts
    totalUsers: Int!
    activeUsers: Int!
    inactiveUsers: Int!
    bannedUsers: Int!
    mutedUsers: Int!
    
    # Roles
    byRole: [RoleStats!]!
    bySubscription: [TierStats!]!
    
    # Activity
    topPosters: [User!]!
    mostActive: [User!]!
    newestMembers: [User!]!
  }

  type RoleStats {
    role: UserRole!
    count: Int!
    percentage: Float!
    activity: Float!
  }

  type TierStats {
    tier: SubscriptionTier!
    count: Int!
    percentage: Float!
    activity: Float!
  }

  type MessageStats {
    # Counts
    totalMessages: Int!
    flaggedMessages: Int!
    moderatedMessages: Int!
    deletedMessages: Int!
    
    # Types
    byType: [MessageTypeStats!]!
    
    # Quality
    averageLength: Int!
    responseRate: Float!
    editRate: Float!
    deleteRate: Float!
    
    # Timing
    averageResponseTime: Int!
    busiestTimes: [TimeStats!]!
  }

  type MessageTypeStats {
    type: MessageType!
    count: Int!
    percentage: Float!
    flagged: Int!
  }

  enum MessageType {
    TEXT
    IMAGE
    VIDEO
    AUDIO
    FILE
    LINK
    CODE
    SYSTEM
    ANNOUNCEMENT
  }

  type TimeStats {
    hour: Int!
    messages: Int!
    users: Int!
    activity: Float!
  }

  type MessageDetail {
    id: ID!
    room: ChatRoom!
    sender: User!
    content: String!
    type: MessageType!
    status: MessageStatus!
    
    # Metadata
    edited: Boolean!
    editedAt: DateTime
    deleted: Boolean!
    deletedAt: DateTime
    deletedBy: User
    
    # Moderation
    flagged: Boolean!
    flaggedBy: [User!]
    flaggedAt: DateTime
    moderated: Boolean!
    moderatedBy: Admin
    moderatedAt: DateTime
    moderationReason: String
    
    # Attachments
    attachments: [Attachment!]
    
    # Reactions
    reactions: [Reaction!]
    
    # References
    replyTo: MessageDetail
    mentions: [User!]
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Attachment {
    id: ID!
    message: MessageDetail!
    type: AttachmentType!
    url: String!
    filename: String
    size: Int
    dimensions: String
    duration: Int
  }

  enum AttachmentType {
    IMAGE
    VIDEO
    AUDIO
    FILE
    LINK
  }

  type Reaction {
    id: ID!
    message: MessageDetail!
    user: User!
    emoji: String!
    timestamp: DateTime!
  }

  type Warning {
    id: ID!
    user: User!
    room: ChatRoom!
    admin: Admin!
    reason: String!
    severity: WarningSeverity!
    
    # Details
    points: Int!
    expiresAt: DateTime
    acknowledged: Boolean!
    acknowledgedAt: DateTime
    
    # Context
    message: MessageDetail
    previousWarnings: Int
    
    # Timestamps
    createdAt: DateTime!
  }

  enum WarningSeverity {
    LOW
    MEDIUM
    HIGH
  }

  type ChatReport {
    id: ID!
    reporter: User!
    reportedUser: User
    reportedMessage: MessageDetail
    reportedRoom: ChatRoom
    status: ReportStatus!
    
    # Details
    reason: ReportReason!
    description: String!
    evidence: [String!]
    severity: ReportSeverity!
    
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

  enum ReportReason {
    HARASSMENT
    HATE_SPEECH
    SPAM
    SCAM
    IMPERSONATION
    INAPPROPRIATE_CONTENT
    PRIVACY_VIOLATION
    THREATS
    SELF_HARM
    ILLEGAL_CONTENT
    COPYRIGHT
    OTHER
  }

  type Announcement {
    id: ID!
    type: AnnouncementType!
    title: String!
    content: String!
    
    # Target
    rooms: [ChatRoom!]
    users: [User!]
    global: Boolean!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime
    active: Boolean!
    
    # Priority
    priority: AnnouncementPriority!
    
    # Stats
    impressions: Int!
    clicks: Int!
    dismissals: Int!
    
    # Admin
    createdBy: Admin!
    updatedBy: Admin
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ModerationQueue {
    id: ID!
    type: ModerationQueueType!
    
    # Content
    items: [ModerationItem!]!
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

  enum ModerationQueueType {
    REPORTED_MESSAGES
    REPORTED_USERS
    FLAGGED_CONTENT
    PENDING_APPROVAL
    SPAM
    ABUSE
  }

  type ModerationItem {
    id: ID!
    queue: ModerationQueue!
    type: ModerationItemType!
    
    # Content
    message: MessageDetail
    user: User
    report: ChatReport
    
    # Priority
    priority: ItemPriority!
    age: Int!
    
    # Status
    status: ItemStatus!
    assignedTo: Admin
    assignedAt: DateTime
    
    # Timestamps
    createdAt: DateTime!
  }

  enum ModerationItemType {
    MESSAGE
    USER
    REPORT
  }

  enum ItemPriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum ItemStatus {
    PENDING
    ASSIGNED
    IN_PROGRESS
    RESOLVED
    ESCALATED
  }

  type ChatAnalytics {
    # Usage
    totalMessages: Int!
    activeRooms: Int!
    activeUsers: Int!
    peakConcurrency: Int!
    
    # Engagement
    averageMessagesPerUser: Float!
    averageSessionDuration: Int!
    retentionRate: Float!
    
    # Quality
    reportRate: Float!
    moderationRate: Float!
    satisfactionScore: Float!
    
    # Performance
    responseTime: Int!
    uptime: Float!
    errorRate: Float!
    
    # Trends
    growth: GrowthMetrics!
    patterns: UsagePatterns!
    predictions: Predictions!
  }

  type GrowthMetrics {
    userGrowth: Float!
    messageGrowth: Float!
    roomGrowth: Float!
    engagementGrowth: Float!
  }

  type UsagePatterns {
    hourly: [HourlyPattern!]!
    daily: [DailyPattern!]!
    weekly: [WeeklyPattern!]!
    monthly: [MonthlyPattern!]!
  }

  type HourlyPattern {
    hour: Int!
    messages: Int!
    users: Int!
    concurrency: Int!
  }

  type DailyPattern {
    date: DateTime!
    messages: Int!
    users: Int!
    rooms: Int!
  }

  type WeeklyPattern {
    week: Int!
    year: Int!
    messages: Int!
    users: Int!
    growth: Float!
  }

  type MonthlyPattern {
    month: Int!
    year: Int!
    messages: Int!
    users: Int!
    growth: Float!
  }

  type Predictions {
    nextHour: Forecast!
    nextDay: Forecast!
    nextWeek: Forecast!
    nextMonth: Forecast!
  }

  type Forecast {
    messages: Int!
    users: Int!
    concurrency: Int!
    confidence: Float!
  }

  type ChatDashboard {
    # Overview
    stats: ChatManagementStats!
    analytics: ChatAnalytics!
    
    # Queues
    moderationQueues: [ModerationQueue!]!
    
    # Recent Activity
    recentMessages: [MessageDetail!]!
    recentReports: [ChatReport!]!
    recentModerations: [MessageModerationLog!]!
    
    # Top Lists
    topRooms: [RoomDetail!]!
    topUsers: [User!]!
    topReporters: [User!]!
    mostReported: [User!]!
    
    # Alerts
    activeAlerts: [ChatAlert!]!
    
    # Generated At
    generatedAt: DateTime!
  }

  type MessageModerationLog {
    id: ID!
    message: MessageDetail!
    admin: Admin!
    action: ModerationAction!
    
    # Details
    reason: String!
    notes: String
    ipAddress: String
    userAgent: String
    
    # Impact
    affectedUser: User!
    previousStatus: MessageStatus!
    
    # Notification
    notifiedUser: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type ChatAlert {
    id: ID!
    type: ChatAlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    
    # Context
    room: ChatRoom
    user: User
    message: MessageDetail
    
    # Status
    acknowledged: Boolean!
    acknowledgedBy: Admin
    acknowledgedAt: DateTime
    
    # Timestamps
    triggeredAt: DateTime!
    resolvedAt: DateTime
  }

  enum ChatAlertType {
    HIGH_REPORT_RATE
    SPAM_OUTBREAK
    ABUSE_PATTERN
    PERFORMANCE_ISSUE
    SECURITY_BREACH
    CAPACITY_WARNING
    SYSTEM_ERROR
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Chat Management
    chatManagementStats: ChatManagementStats!
    chatDashboard: ChatDashboard!
    
    rooms(
      filter: ChatFilterInput
      pagination: PaginationInput
    ): ChatRoomConnection!
    
    roomDetail(roomId: ID!): RoomDetail!
    
    # Messages
    messages(
      filter: MessageFilterInput
      pagination: PaginationInput
    ): MessageConnection!
    
    messageDetail(messageId: ID!): MessageDetail!
    
    # Moderation
    moderationQueues(type: ModerationQueueType): [ModerationQueue!]!
    moderationHistory(
      roomId: ID
      userId: ID
      adminId: ID
      action: ModerationAction
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [MessageModerationLog!]!
    
    # Reports
    chatReports(
      status: ReportStatus
      reason: ReportReason
      severity: ReportSeverity
      pagination: PaginationInput
    ): [ChatReport!]!
    
    chatReport(reportId: ID!): ChatReport!
    
    # Announcements
    announcements(
      type: AnnouncementType
      active: Boolean
      pagination: PaginationInput
    ): [Announcement!]!
    
    announcement(announcementId: ID!): Announcement!
    
    # Analytics
    chatAnalytics(
      startDate: DateTime
      endDate: DateTime
      groupBy: GroupBy
    ): ChatAnalytics!
    
    # Search
    searchMessages(
      query: String!
      filter: MessageFilterInput
      pagination: PaginationInput
    ): MessageConnection!
    
    # User Activity
    userChatActivity(userId: ID!): UserChatStats!
  }

  type ChatRoomConnection {
    edges: [ChatRoomEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ChatRoomEdge {
    node: ChatRoom!
    cursor: String!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MessageEdge {
    node: MessageDetail!
    cursor: String!
  }

  type UserChatStats {
    user: User!
    
    # Activity
    totalMessages: Int!
    activeRooms: Int!
    averageMessagesPerDay: Float!
    lastActive: DateTime!
    
    # Quality
    reportsFiled: Int!
    reportsReceived: Int!
    warningsReceived: Int!
    moderationsReceived: Int!
    
    # Behavior
    averageMessageLength: Int!
    responseRate: Float!
    engagementScore: Float!
    
    # Risk
    riskScore: Float!
    flaggedMessages: Int!
    moderationHistory: [MessageModerationLog!]!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Room Management
    manageRoom(input: RoomManagementInput!): RoomModerationLog!
    updateRoomConfig(roomId: ID!, config: RoomConfigInput!): RoomConfiguration!
    
    # Message Moderation
    moderateMessage(input: MessageModerationInput!): MessageModerationLog!
    deleteMessage(messageId: ID!, reason: String!, notifyUser: Boolean): MessageDetail!
    restoreMessage(messageId: ID!, reason: String): MessageDetail!
    clearRoomMessages(roomId: ID!, reason: String!, olderThan: DateTime): MessageResponse!
    
    # User Moderation
    moderateUser(input: UserModerationInput!): UserModerationLog!
    muteUser(userId: ID!, roomId: ID!, duration: Int!, reason: String!): UserModerationLog!
    unmuteUser(userId: ID!, roomId: ID!, reason: String): UserModerationLog!
    kickUser(userId: ID!, roomId: ID!, reason: String!): UserModerationLog!
    banUser(userId: ID!, roomId: ID!, duration: Int!, reason: String!): UserModerationLog!
    unbanUser(userId: ID!, roomId: ID!, reason: String): UserModerationLog!
    
    # Reports
    createChatReport(input: ChatReportInput!): ChatReport!
    updateReportStatus(reportId: ID!, status: ReportStatus!, notes: String): ChatReport!
    assignReport(reportId: ID!, adminId: ID!): ChatReport!
    takeReportAction(input: ReportActionInput!): ChatReport!
    dismissReport(reportId: ID!, reason: String): ChatReport!
    escalateReport(reportId: ID!, reason: String!, toRole: AdminRole): ChatReport!
    
    # Announcements
    createAnnouncement(input: AnnouncementInput!): Announcement!
    updateAnnouncement(announcementId: ID!, input: AnnouncementInput!): Announcement!
    deleteAnnouncement(announcementId: ID!, reason: String): MessageResponse!
    activateAnnouncement(announcementId: ID!): Announcement!
    deactivateAnnouncement(announcementId: ID!): Announcement!
    
    # Moderation Queue
    assignToQueue(queueId: ID!, adminId: ID!): ModerationQueue!
    unassignFromQueue(queueId: ID!, adminId: ID!): ModerationQueue!
    processQueueItem(queueId: ID!, itemId: ID!, action: ModerationAction!, notes: String): ModerationQueue!
    
    # Automation
    updateAutoModeration(roomId: ID!, settings: AutoModerationInput!): RoomConfiguration!
    updateWordFilter(roomId: ID!, words: [String!]!, action: FilterAction!): RoomConfiguration!
    updateSpamFilter(roomId: ID!, enabled: Boolean!, sensitivity: Int): RoomConfiguration!
    
    # Communication
    sendRoomNotification(roomId: ID!, title: String!, message: String!, type: NotificationType, urgent: Boolean): MessageResponse!
    sendUserNotification(userId: ID!, title: String!, message: String!, type: NotificationType, urgent: Boolean): MessageResponse!
    broadcastAnnouncement(title: String!, message: String!, priority: AnnouncementPriority): MessageResponse!
  }

  input RoomConfigInput {
    maxUsers: Int
    messageRateLimit: Int
    joinPermissions: JoinPermissionsInput
    messagePermissions: MessagePermissionsInput
    moderationSettings: ModerationSettingsInput
    description: String
    rules: [String!]
    tags: [String!]
    autoModeration: Boolean
    wordFilter: [String!]
    linkFilter: Boolean
    imageFilter: Boolean
    spamFilter: Boolean
  }

  input JoinPermissionsInput {
    open: Boolean
    requireInvite: Boolean
    requireApproval: Boolean
    requireSubscription: Boolean
    allowedRoles: [UserRole!]
    allowedCountries: [String!]
    allowedLanguages: [String!]
    blacklistedUsers: [ID!]
  }

  input MessagePermissionsInput {
    canSend: Boolean
    canEdit: Boolean
    canDelete: Boolean
    canPin: Boolean
    canAnnounce: Boolean
    canInvite: Boolean
    canModerate: Boolean
    rateLimit: Int
    characterLimit: Int
    attachmentLimit: Int
  }

  input ModerationSettingsInput {
    autoFlag: Boolean
    autoDelete: Boolean
    requireApproval: Boolean
    moderationQueue: Boolean
    reportThreshold: Int
    warnThreshold: Int
    muteThreshold: Int
    banThreshold: Int
  }

  input ChatReportInput {
    reporterId: ID!
    reportedUserId: ID
    reportedMessageId: ID
    reportedRoomId: ID
    reason: ReportReason!
    description: String!
    evidence: [String!]
    severity: ReportSeverity
  }

  input AutoModerationInput {
    enabled: Boolean!
    sensitivity: Int!
    actions: [AutoModerationAction!]!
    filters: [FilterConfig!]!
  }

  enum AutoModerationAction {
    WARN
    DELETE
    MUTE
    KICK
    REPORT
  }

  input FilterConfig {
    type: FilterType!
    pattern: String!
    action: FilterAction!
    severity: SeverityLevel!
  }

  enum FilterType {
    TEXT
    LINK
    IMAGE
    USER
    BEHAVIOR
  }

  enum FilterAction {
    ALLOW
    WARN
    BLOCK
    DELETE
    REPORT
  }

  type UserModerationLog {
    id: ID!
    user: User!
    room: ChatRoom!
    admin: Admin!
    action: ModerationAction!
    
    # Details
    reason: String!
    duration: Int
    notes: String
    ipAddress: String
    userAgent: String
    
    # Context
    message: MessageDetail
    
    # Notification
    notifiedUser: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
    expiresAt: DateTime
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    messageModerated: MessageModerationLog!
    userModerated(roomId: ID!): UserModerationLog!
    reportCreated: ChatReport!
    announcementPublished: Announcement!
    roomActivity(roomId: ID!): RoomActivity!
  }
`;

export default chatManagementTypeDef;