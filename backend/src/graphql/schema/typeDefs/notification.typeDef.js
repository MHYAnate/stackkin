// apps/backend/src/graphql/schema/typeDefs/notification.typeDef.js
import { gql } from 'apollo-server-express';

export const notificationTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum NotificationType {
    SYSTEM
    PERSONAL
    GROUP
    BROADCAST
  }

  enum NotificationCategory {
    SOLUTION
    JOB
    MARKETPLACE
    CHAT
    SQUAD
    SUBSCRIPTION
    PAYMENT
    VERIFICATION
    ACHIEVEMENT
    SECURITY
    ADMIN
    OTHER
  }

  enum NotificationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum NotificationStatus {
    SENT
    DELIVERED
    READ
    FAILED
    ARCHIVED
  }

  enum NotificationChannel {
    IN_APP
    EMAIL
    PUSH
    SMS
    WEBHOOK
  }

  enum EmailStatus {
    DRAFT
    QUEUED
    SENT
    DELIVERED
    OPENED
    CLICKED
    BOUNCED
    COMPLAINED
    FAILED
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateNotificationInput {
    userId: ID
    groupId: ID
    type: NotificationType!
    category: NotificationCategory!
    priority: NotificationPriority!
    title: String!
    message: String!
    data: JSON
    actionUrl: String
    actionLabel: String
    channels: [NotificationChannel!]!
    scheduledFor: DateTime
  }

  input UpdateNotificationInput {
    status: NotificationStatus
    read: Boolean
    archived: Boolean
  }

  input NotificationFilterInput {
    type: NotificationType
    category: NotificationCategory
    status: NotificationStatus
    priority: NotificationPriority
    channel: NotificationChannel
    read: Boolean
    archived: Boolean
    startDate: DateTime
    endDate: DateTime
    search: String
  }

  input SendEmailInput {
    to: [String!]!
    subject: String!
    template: String!
    variables: JSON
    attachments: [EmailAttachmentInput!]
    scheduledFor: DateTime
    tags: [String!]
  }

  input EmailAttachmentInput {
    filename: String!
    content: String!
    contentType: String!
    encoding: String
  }

  input TemplateInput {
    name: String!
    subject: String!
    htmlContent: String!
    textContent: String
    category: EmailCategory!
    variables: [String!]!
    active: Boolean!
  }

  input PushNotificationInput {
    userId: ID
    deviceToken: String
    title: String!
    body: String!
    data: JSON
    badge: Int
    sound: String
    ttl: Int
    priority: PushPriority!
  }

  enum EmailCategory {
    WELCOME
    VERIFICATION
    PASSWORD_RESET
    PAYMENT_RECEIPT
    SUBSCRIPTION
    SECURITY
    MARKETING
    TRANSACTIONAL
    SYSTEM
  }

  enum PushPriority {
    NORMAL
    HIGH
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Notification {
    id: ID!
    user: User
    group: Group
    
    # Content
    type: NotificationType!
    category: NotificationCategory!
    priority: NotificationPriority!
    title: String!
    message: String!
    data: JSON
    
    # Actions
    actionUrl: String
    actionLabel: String
    actions: [NotificationAction!]
    
    # Delivery
    channels: [NotificationChannel!]!
    status: NotificationStatus!
    deliveryStatus: DeliveryStatus!
    
    # Metadata
    metadata: JSON
    tags: [String!]
    
    # Tracking
    read: Boolean!
    readAt: DateTime
    archived: Boolean!
    archivedAt: DateTime
    
    # Timestamps
    createdAt: DateTime!
    scheduledFor: DateTime
    sentAt: DateTime
    deliveredAt: DateTime
    expiresAt: DateTime
  }

  type NotificationAction {
    label: String!
    url: String!
    method: String
    confirm: Boolean
    confirmMessage: String
  }

  type DeliveryStatus {
    inApp: ChannelStatus
    email: ChannelStatus
    push: ChannelStatus
    sms: ChannelStatus
    webhook: ChannelStatus
  }

  type ChannelStatus {
    sent: Boolean!
    sentAt: DateTime
    delivered: Boolean!
    deliveredAt: DateTime
    opened: Boolean!
    openedAt: DateTime
    clicked: Boolean!
    clickedAt: DateTime
    failed: Boolean!
    failureReason: String
  }

  type NotificationPreferences {
    id: ID!
    user: User!
    
    # Channel Preferences
    enableInApp: Boolean!
    enableEmail: Boolean!
    enablePush: Boolean!
    enableSMS: Boolean!
    
    # Category Preferences
    categories: NotificationCategoryPreferences!
    
    # Quiet Hours
    quietHoursEnabled: Boolean!
    quietHoursStart: String!
    quietHoursEnd: String!
    quietHoursTimezone: String!
    
    # Rate Limiting
    maxDailyEmails: Int!
    maxDailyPush: Int!
    maxDailySMS: Int!
    
    # Timestamps
    updatedAt: DateTime!
  }

  type NotificationCategoryPreferences {
    solution: CategoryPreference!
    job: CategoryPreference!
    marketplace: CategoryPreference!
    chat: CategoryPreference!
    squad: CategoryPreference!
    subscription: CategoryPreference!
    payment: CategoryPreference!
    verification: CategoryPreference!
    achievement: CategoryPreference!
    security: CategoryPreference!
    admin: CategoryPreference!
    other: CategoryPreference!
  }

  type CategoryPreference {
    inApp: Boolean!
    email: Boolean!
    push: Boolean!
    sms: Boolean!
    priority: NotificationPriority!
  }

  type Email {
    id: ID!
    from: EmailAddress!
    to: [EmailAddress!]!
    subject: String!
    
    # Content
    htmlContent: String
    textContent: String
    template: String
    templateVariables: JSON
    
    # Status
    status: EmailStatus!
    events: [EmailEvent!]!
    
    # Delivery
    messageId: String!
    providerId: String
    providerResponse: JSON
    
    # Attachments
    attachments: [EmailAttachment!]
    
    # Tracking
    opened: Boolean!
    openedAt: DateTime
    openedCount: Int!
    clicked: Boolean!
    clickedAt: DateTime
    clickedCount: Int!
    
    # Metadata
    tags: [String!]
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    scheduledFor: DateTime
    sentAt: DateTime
    deliveredAt: DateTime
  }

  type EmailAddress {
    email: String!
    name: String
  }

  type EmailEvent {
    type: EmailEventType!
    timestamp: DateTime!
    data: JSON
    ipAddress: String
    userAgent: String
    location: String
  }

  enum EmailEventType {
    SENT
    DELIVERED
    OPENED
    CLICKED
    BOUNCED
    COMPLAINED
    UNSUBSCRIBED
    FAILED
  }

  type EmailAttachment {
    filename: String!
    contentType: String!
    size: Int!
    url: String
  }

  type EmailTemplate {
    id: ID!
    name: String!
    subject: String!
    htmlContent: String!
    textContent: String
    category: EmailCategory!
    
    # Variables
    variables: [String!]!
    sampleVariables: JSON
    
    # Metadata
    description: String
    tags: [String!]
    active: Boolean!
    usedCount: Int!
    
    # Preview
    previewUrl: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PushDevice {
    id: ID!
    user: User!
    token: String!
    platform: Platform!
    deviceModel: String
    osVersion: String
    appVersion: String
    
    # Status
    active: Boolean!
    lastActiveAt: DateTime!
    
    # Metadata
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum Platform {
    IOS
    ANDROID
    WEB
    DESKTOP
  }

  type PushNotification {
    id: ID!
    device: PushDevice!
    title: String!
    body: String!
    data: JSON
    
    # Delivery
    sent: Boolean!
    sentAt: DateTime
    delivered: Boolean!
    deliveredAt: DateTime
    opened: Boolean!
    openedAt: DateTime
    
    # Metadata
    badge: Int
    sound: String
    ttl: Int
    priority: PushPriority!
    collapseKey: String
    
    # Failure
    failed: Boolean!
    failureReason: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type NotificationStats {
    # Totals
    totalNotifications: Int!
    totalEmails: Int!
    totalPush: Int!
    totalSMS: Int!
    
    # Rates
    deliveryRate: Float!
    openRate: Float!
    clickRate: Float!
    
    # By Category
    byCategory: [CategoryStats!]!
    
    # By Channel
    byChannel: [ChannelStats!]!
    
    # Real-time
    unreadCount: Int!
    recentNotifications: [Notification!]!
  }

  type CategoryStats {
    category: NotificationCategory!
    count: Int!
    deliveryRate: Float!
    openRate: Float!
  }

  type ChannelStats {
    channel: NotificationChannel!
    count: Int!
    deliveryRate: Float!
    openRate: Float!
  }

  type NotificationBatch {
    id: ID!
    name: String!
    description: String
    status: BatchStatus!
    
    # Configuration
    template: EmailTemplate
    audience: AudienceCriteria!
    variables: JSON
    
    # Progress
    totalRecipients: Int!
    processed: Int!
    successful: Int!
    failed: Int!
    
    # Scheduling
    scheduledFor: DateTime
    startedAt: DateTime
    completedAt: DateTime
    
    # Results
    results: BatchResults!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum BatchStatus {
    DRAFT
    SCHEDULED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  type AudienceCriteria {
    filters: JSON!
    userCount: Int!
    preview: [User!]!
  }

  type BatchResults {
    deliveryRate: Float!
    openRate: Float!
    clickRate: Float!
    bounceRate: Float!
    complaintRate: Float!
    detailedStats: JSON
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Current User
    myNotifications(
      filter: NotificationFilterInput
      pagination: PaginationInput
    ): NotificationConnection!
    
    myUnreadNotifications: [Notification!]!
    myNotificationPreferences: NotificationPreferences!
    myNotificationStats: NotificationStats!
    
    # Emails
    myEmails(
      status: EmailStatus
      pagination: PaginationInput
    ): EmailConnection!
    
    # Push
    myPushDevices: [PushDevice!]!
    
    # Admin
    allNotifications(
      filter: NotificationFilterInput
      pagination: PaginationInput
    ): NotificationConnection!
    
    emailTemplates(
      category: EmailCategory
      active: Boolean
    ): [EmailTemplate!]!
    
    emailTemplate(templateId: ID!): EmailTemplate!
    
    notificationBatches(
      status: BatchStatus
      pagination: PaginationInput
    ): NotificationBatchConnection!
    
    # Preview
    previewNotification(input: CreateNotificationInput!): Notification!
    previewEmail(templateId: ID!, variables: JSON): String!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  type EmailConnection {
    edges: [EmailEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EmailEdge {
    node: Email!
    cursor: String!
  }

  type NotificationBatchConnection {
    edges: [NotificationBatchEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NotificationBatchEdge {
    node: NotificationBatch!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Notifications
    markNotificationRead(notificationId: ID!): Notification!
    markAllNotificationsRead: MessageResponse!
    archiveNotification(notificationId: ID!): Notification!
    deleteNotification(notificationId: ID!): MessageResponse!
    clearAllNotifications: MessageResponse!
    
    # Preferences
    updateNotificationPreferences(input: UpdatePreferencesInput!): NotificationPreferences!
    
    # Emails
    sendEmail(input: SendEmailInput!): Email!
    resendEmail(emailId: ID!): Email!
    
    # Templates
    createEmailTemplate(input: TemplateInput!): EmailTemplate!
    updateEmailTemplate(templateId: ID!, input: TemplateInput!): EmailTemplate!
    deleteEmailTemplate(templateId: ID!): MessageResponse!
    duplicateEmailTemplate(templateId: ID!, newName: String!): EmailTemplate!
    
    # Push
    registerPushDevice(token: String!, platform: Platform!, metadata: JSON): PushDevice!
    updatePushDevice(deviceId: ID!, active: Boolean!): PushDevice!
    unregisterPushDevice(deviceId: ID!): MessageResponse!
    sendPushNotification(input: PushNotificationInput!): PushNotification!
    
    # Admin
    createNotification(input: CreateNotificationInput!): Notification!
    createBulkNotifications(inputs: [CreateNotificationInput!]!): [Notification!]!
    
    createNotificationBatch(
      name: String!
      templateId: ID!
      audience: AudienceInput!
      scheduledFor: DateTime
    ): NotificationBatch!
    
    cancelNotificationBatch(batchId: ID!): NotificationBatch!
    retryNotificationBatch(batchId: ID!): NotificationBatch!
    
    # Testing
    testNotification(channel: NotificationChannel!): MessageResponse!
    testEmail(templateId: ID!): Email!
    testPush(deviceId: ID!): PushNotification!
  }

  input UpdatePreferencesInput {
    enableInApp: Boolean
    enableEmail: Boolean
    enablePush: Boolean
    enableSMS: Boolean
    
    categories: CategoryPreferencesInput
    
    quietHoursEnabled: Boolean
    quietHoursStart: String
    quietHoursEnd: String
    quietHoursTimezone: String
  }

  input CategoryPreferencesInput {
    solution: CategoryPreferenceInput
    job: CategoryPreferenceInput
    marketplace: CategoryPreferenceInput
    chat: CategoryPreferenceInput
    squad: CategoryPreferenceInput
    subscription: CategoryPreferenceInput
    payment: CategoryPreferenceInput
    verification: CategoryPreferenceInput
    achievement: CategoryPreferenceInput
    security: CategoryPreferenceInput
    admin: CategoryPreferenceInput
    other: CategoryPreferenceInput
  }

  input CategoryPreferenceInput {
    inApp: Boolean
    email: Boolean
    push: Boolean
    sms: Boolean
    priority: NotificationPriority
  }

  input AudienceInput {
    filters: JSON!
    limit: Int
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    newNotification: Notification!
    notificationRead: Notification!
    emailStatusChanged(emailId: ID!): Email!
    pushNotificationReceived: PushNotification!
  }
`;

export default notificationTypeDef;