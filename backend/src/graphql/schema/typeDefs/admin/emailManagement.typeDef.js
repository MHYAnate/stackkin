// apps/backend/src/graphql/schema/typeDefs/admin/emailManagement.typeDef.js

import { gql } from 'apollo-server-express';

const emailManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================

  enum EmailTemplateType {
    VERIFICATION
    PASSWORD_RESET
    WELCOME
    SUBSCRIPTION_CONFIRMATION
    SUBSCRIPTION_RENEWAL_REMINDER
    SUBSCRIPTION_EXPIRED
    JOB_APPLICATION_RECEIVED
    JOB_APPLICATION_STATUS
    SOLUTION_APPROVED
    SOLUTION_REJECTED
    PAYMENT_CONFIRMATION
    REFUND_CONFIRMATION
    SECURITY_ALERT
    TWO_FACTOR_CODE
    ACCOUNT_SUSPENDED
    ACCOUNT_REACTIVATED
    NEWSLETTER
    PROMOTIONAL
    SYSTEM_NOTIFICATION
    CUSTOM
  }

  enum EmailStatus {
    PENDING
    QUEUED
    SENT
    DELIVERED
    BOUNCED
    FAILED
    OPENED
    CLICKED
    UNSUBSCRIBED
  }

  enum EmailPriority {
    LOW
    NORMAL
    HIGH
    CRITICAL
  }

  enum EmailCampaignStatus {
    DRAFT
    SCHEDULED
    SENDING
    SENT
    PAUSED
    CANCELLED
  }

  enum RecipientType {
    ALL_USERS
    VERIFIED_USERS
    SUBSCRIPTION_TIER
    CUSTOM_LIST
    SEGMENT
  }

  enum EmailSortField {
    CREATED_AT
    SENT_AT
    STATUS
    RECIPIENT
    TEMPLATE
  }

  # ============================================
  # TYPES
  # ============================================

  type EmailTemplate {
    id: ID!
    name: String!
    type: EmailTemplateType!
    subject: String!
    htmlContent: String!
    textContent: String
    
    # Variables
    variables: [TemplateVariable!]!
    
    # Settings
    isActive: Boolean!
    isDefault: Boolean!
    language: String!
    
    # Preview
    previewUrl: String
    
    # Versioning
    version: Int!
    previousVersions: [EmailTemplateVersion!]!
    
    # Meta
    createdBy: Admin!
    lastModifiedBy: Admin
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TemplateVariable {
    name: String!
    description: String!
    required: Boolean!
    defaultValue: String
    exampleValue: String
  }

  type EmailTemplateVersion {
    version: Int!
    subject: String!
    htmlContent: String!
    modifiedBy: Admin!
    modifiedAt: DateTime!
    changeNote: String
  }

  type Email {
    id: ID!
    template: EmailTemplate
    recipient: EmailRecipient!
    subject: String!
    htmlContent: String!
    textContent: String
    
    # Status
    status: EmailStatus!
    priority: EmailPriority!
    
    # Timestamps
    createdAt: DateTime!
    queuedAt: DateTime
    sentAt: DateTime
    deliveredAt: DateTime
    openedAt: DateTime
    clickedAt: DateTime
    bouncedAt: DateTime
    failedAt: DateTime
    
    # Tracking
    opens: Int!
    clicks: Int!
    clickedLinks: [ClickedLink!]!
    
    # Error Info
    errorMessage: String
    errorCode: String
    retryCount: Int!
    
    # Resend Info
    resendApiId: String
    
    # Campaign
    campaign: EmailCampaign
    
    # Meta
    metadata: JSON
  }

  type EmailRecipient {
    email: String!
    name: String
    userId: ID
    user: User
  }

  type ClickedLink {
    url: String!
    clickedAt: DateTime!
    ipAddress: String
    userAgent: String
  }

  type EmailCampaign {
    id: ID!
    name: String!
    description: String
    template: EmailTemplate!
    
    # Recipients
    recipientType: RecipientType!
    recipientFilter: JSON
    recipientCount: Int!
    
    # Schedule
    status: EmailCampaignStatus!
    scheduledFor: DateTime
    startedAt: DateTime
    completedAt: DateTime
    
    # Stats
    stats: CampaignStats!
    
    # A/B Testing
    isABTest: Boolean!
    variants: [CampaignVariant!]
    
    # Meta
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CampaignStats {
    totalRecipients: Int!
    sent: Int!
    delivered: Int!
    opened: Int!
    clicked: Int!
    bounced: Int!
    failed: Int!
    unsubscribed: Int!
    
    # Rates
    openRate: Float!
    clickRate: Float!
    bounceRate: Float!
    unsubscribeRate: Float!
  }

  type CampaignVariant {
    id: ID!
    name: String!
    subject: String!
    percentage: Float!
    stats: CampaignStats!
    isWinner: Boolean
  }

  type EmailStats {
    # Overview
    totalSent: Int!
    totalDelivered: Int!
    totalOpened: Int!
    totalClicked: Int!
    totalBounced: Int!
    totalFailed: Int!
    
    # Rates
    deliveryRate: Float!
    openRate: Float!
    clickRate: Float!
    bounceRate: Float!
    
    # By Template
    byTemplate: [TemplateStats!]!
    
    # By Status
    byStatus: [StatusStats!]!
    
    # Time Series
    sentByDay: [DailyEmailStats!]!
    
    # Top Performers
    topOpenedTemplates: [EmailTemplate!]!
    topClickedTemplates: [EmailTemplate!]!
  }

  type TemplateStats {
    template: EmailTemplate!
    sent: Int!
    opened: Int!
    clicked: Int!
    openRate: Float!
    clickRate: Float!
  }

  type StatusStats {
    status: EmailStatus!
    count: Int!
    percentage: Float!
  }

  type DailyEmailStats {
    date: DateTime!
    sent: Int!
    delivered: Int!
    opened: Int!
    clicked: Int!
    bounced: Int!
  }

  type EmailQueue {
    pending: Int!
    queued: Int!
    sending: Int!
    failed: Int!
    oldestPending: DateTime
  }

  type UnsubscribedUser {
    id: ID!
    email: String!
    user: User
    unsubscribedAt: DateTime!
    reason: String
    emailTypes: [EmailTemplateType!]!
  }

  type EmailSettings {
    fromEmail: String!
    fromName: String!
    replyToEmail: String!
    dailySendLimit: Int!
    rateLimitPerSecond: Int!
    retryAttempts: Int!
    retryDelaySeconds: Int!
    trackOpens: Boolean!
    trackClicks: Boolean!
    unsubscribeUrl: String!
  }

  type EmailPreview {
    subject: String!
    htmlContent: String!
    textContent: String
  }

  # ============================================
  # INPUTS
  # ============================================

  input EmailFilterInput {
    status: [EmailStatus!]
    templateType: [EmailTemplateType!]
    recipientEmail: String
    dateFrom: DateTime
    dateTo: DateTime
    campaignId: ID
  }

  input EmailListInput {
    filter: EmailFilterInput
    sortBy: EmailSortField
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input CreateEmailTemplateInput {
    name: String!
    type: EmailTemplateType!
    subject: String!
    htmlContent: String!
    textContent: String
    variables: [TemplateVariableInput!]
    language: String
    isActive: Boolean
  }

  input UpdateEmailTemplateInput {
    templateId: ID!
    name: String
    subject: String
    htmlContent: String
    textContent: String
    variables: [TemplateVariableInput!]
    isActive: Boolean
    changeNote: String
  }

  input TemplateVariableInput {
    name: String!
    description: String!
    required: Boolean!
    defaultValue: String
    exampleValue: String
  }

  input SendEmailInput {
    templateId: ID
    recipientEmail: String!
    recipientName: String
    subject: String
    htmlContent: String
    textContent: String
    variables: JSON
    priority: EmailPriority
    metadata: JSON
  }

  input SendBulkEmailInput {
    templateId: ID!
    recipients: [EmailRecipientInput!]!
    variables: JSON
    priority: EmailPriority
    scheduledFor: DateTime
  }

  input EmailRecipientInput {
    email: String!
    name: String
    userId: ID
    personalizedVariables: JSON
  }

  input CreateCampaignInput {
    name: String!
    description: String
    templateId: ID!
    recipientType: RecipientType!
    recipientFilter: JSON
    scheduledFor: DateTime
    isABTest: Boolean
    variants: [CampaignVariantInput!]
  }

  input CampaignVariantInput {
    name: String!
    subject: String!
    percentage: Float!
  }

  input UpdateCampaignInput {
    campaignId: ID!
    name: String
    description: String
    scheduledFor: DateTime
  }

  input PreviewEmailInput {
    templateId: ID!
    variables: JSON
    recipientEmail: String
  }

  input UpdateEmailSettingsInput {
    fromEmail: String
    fromName: String
    replyToEmail: String
    dailySendLimit: Int
    rateLimitPerSecond: Int
    retryAttempts: Int
    retryDelaySeconds: Int
    trackOpens: Boolean
    trackClicks: Boolean
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Templates
    emailTemplates(type: EmailTemplateType, activeOnly: Boolean): [EmailTemplate!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    emailTemplate(id: ID!): EmailTemplate @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    emailTemplateVersions(templateId: ID!): [EmailTemplateVersion!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Emails
    emails(input: EmailListInput!): PaginatedEmails! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    email(id: ID!): Email @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    userEmails(userId: ID!, limit: Int): [Email!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Campaigns
    emailCampaigns(status: EmailCampaignStatus): [EmailCampaign!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    emailCampaign(id: ID!): EmailCampaign @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    campaignEmails(campaignId: ID!, status: EmailStatus): [Email!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Stats
    emailStats(dateFrom: DateTime, dateTo: DateTime): EmailStats! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    emailQueue: EmailQueue! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Unsubscribes
    unsubscribedUsers(limit: Int, offset: Int): [UnsubscribedUser!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Settings
    emailSettings: EmailSettings! @auth(requires: [SUPER_ADMIN])
    
    # Preview
    previewEmail(input: PreviewEmailInput!): EmailPreview! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
  }

  type PaginatedEmails {
    emails: [Email!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Templates
    createEmailTemplate(input: CreateEmailTemplateInput!): EmailTemplate! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    updateEmailTemplate(input: UpdateEmailTemplateInput!): EmailTemplate! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    deleteEmailTemplate(templateId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    duplicateEmailTemplate(templateId: ID!, newName: String!): EmailTemplate! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    setDefaultTemplate(templateId: ID!, type: EmailTemplateType!): EmailTemplate! @auth(requires: [SUPER_ADMIN])
    restoreTemplateVersion(templateId: ID!, version: Int!): EmailTemplate! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Sending
    sendEmail(input: SendEmailInput!): Email! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    sendBulkEmail(input: SendBulkEmailInput!): [Email!]! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    resendEmail(emailId: ID!): Email! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Campaigns
    createEmailCampaign(input: CreateCampaignInput!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    updateEmailCampaign(input: UpdateCampaignInput!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    startCampaign(campaignId: ID!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    pauseCampaign(campaignId: ID!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    cancelCampaign(campaignId: ID!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    selectABTestWinner(campaignId: ID!, variantId: ID!): EmailCampaign! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Queue Management
    retryFailedEmails(olderThanHours: Int): Int! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    clearEmailQueue: Int! @auth(requires: [SUPER_ADMIN])
    
    # Unsubscribes
    resubscribeUser(email: String!): Boolean! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    
    # Settings
    updateEmailSettings(input: UpdateEmailSettingsInput!): EmailSettings! @auth(requires: [SUPER_ADMIN])
    
    # Test
    sendTestEmail(templateId: ID!, recipientEmail: String!, variables: JSON): Email! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    emailSent: Email! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    emailBounced: Email! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
    campaignProgress(campaignId: ID!): CampaignStats! @auth(requires: [EMAIL_ADMIN, SUPER_ADMIN])
  }
`;

export default emailManagementTypeDef;