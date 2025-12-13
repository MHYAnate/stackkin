// apps/backend/src/graphql/schema/typeDefs/subscription.typeDef.js
import { gql } from 'apollo-server-express';

export const subscriptionTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum SubscriptionTier {
    FREE
    BASE
    MID
    TOP
  }

  enum SubscriptionDuration {
    YEARLY
    HALF_YEARLY
    LIFETIME
  }

  enum SubscriptionStatus {
    ACTIVE
    PENDING
    CANCELLED
    EXPIRED
    SUSPENDED
  }

  enum PaymentFrequency {
    MONTHLY
    QUARTERLY
    HALF_YEARLY
    YEARLY
    LIFETIME
  }

  enum BillingCycle {
    CALENDAR_MONTH
    CALENDAR_YEAR
    DAY_30
    DAY_365
  }

  enum BenefitType {
    JOB_POSTS
    MARKETPLACE_SLOTS
    CHAT_ACCESS
    TALENT_POOL
    ANNOUNCEMENTS
    PREMIUM_SOLUTIONS
    PRIORITY_VISIBILITY
    ADVERTISING
    MENTORSHIP
    CUSTOMIZATION
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input SubscribeInput {
    tier: SubscriptionTier!
    duration: SubscriptionDuration!
    autoRenew: Boolean!
    paymentMethodId: String
  }

  input UpdateSubscriptionInput {
    tier: SubscriptionTier
    autoRenew: Boolean
    paymentMethodId: String
  }

  input CancelSubscriptionInput {
    reason: String
    immediate: Boolean
  }

  input UpgradeSubscriptionInput {
    targetTier: SubscriptionTier!
    prorated: Boolean
    immediate: Boolean
  }

  input SubscriptionFilterInput {
    tier: SubscriptionTier
    status: SubscriptionStatus
    duration: SubscriptionDuration
    userId: ID
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  input BenefitUsageInput {
    benefitType: BenefitType!
    quantity: Int!
    metadata: JSON
  }

  input TierConfigurationInput {
    tier: SubscriptionTier!
    name: String!
    description: String!
    priceYearly: Int!
    priceHalfYearly: Int
    priceLifetime: Int
    jobPosts: Int!
    marketplaceSlots: Int!
    chatAccess: String!
    talentPoolAccess: Boolean!
    announcementPrivileges: Boolean!
    solutionUpgrades: Boolean!
    priorityVisibility: String!
    advertisingCredits: Int
    mentorshipHours: Int
    features: [String!]!
    limits: JSON!
    active: Boolean!
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Subscription {
    id: ID!
    user: User!
    tier: SubscriptionTier!
    duration: SubscriptionDuration!
    status: SubscriptionStatus!
    
    # Pricing
    basePrice: Int!
    actualPrice: Int!
    currency: String!
    billingCycle: BillingCycle!
    
    # Dates
    startDate: DateTime!
    endDate: DateTime!
    nextBillingDate: DateTime
    cancelledAt: DateTime
    trialEndsAt: DateTime
    
    # Features & Usage
    features: SubscriptionFeatures!
    usage: SubscriptionUsage!
    limits: SubscriptionLimits!
    
    # Payment
    autoRenew: Boolean!
    paymentMethod: PaymentMethod
    invoicePrefix: String!
    
    # Metadata
    metadata: JSON
    notes: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SubscriptionFeatures {
    jobPosts: Int!
    marketplaceSlots: Int!
    chatAccess: ChatAccessLevel!
    talentPoolAccess: Boolean!
    announcementPrivileges: Boolean!
    solutionUpgrades: Boolean!
    priorityVisibility: PriorityLevel!
    advertisingCredits: Int
    mentorshipHours: Int
    customFeatures: [String!]!
  }

  type SubscriptionUsage {
    jobPostsUsed: Int!
    jobPostsRemaining: Int!
    marketplaceSlotsUsed: Int!
    marketplaceSlotsRemaining: Int!
    advertisingCreditsUsed: Int!
    advertisingCreditsRemaining: Int!
    mentorshipHoursUsed: Int!
    mentorshipHoursRemaining: Int!
    lastResetDate: DateTime!
    nextResetDate: DateTime!
  }

  type SubscriptionLimits {
    maxJobPosts: Int!
    maxMarketplaceSlots: Int!
    maxChatRooms: Int!
    maxChatMessages: Int!
    maxFileUploadSize: Int!
    maxStorage: Int!
    maxTeamMembers: Int!
    maxApiCalls: Int!
    maxConcurrentJobs: Int!
  }

  type SubscriptionTierDetail {
    tier: SubscriptionTier!
    name: String!
    description: String!
    priceYearly: Int!
    priceHalfYearly: Int
    priceLifetime: Int
    features: [String!]!
    limits: SubscriptionLimits!
    popular: Boolean!
    recommended: Boolean!
    active: Boolean!
  }

  type SubscriptionBenefit {
    id: ID!
    type: BenefitType!
    name: String!
    description: String!
    icon: String!
    tierRequirements: [SubscriptionTier!]!
    usageLimit: Int
    currentUsage: Int!
    resetFrequency: String
    lastReset: DateTime
    nextReset: DateTime
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    subscription: Subscription!
    user: User!
    amount: Int!
    currency: String!
    status: InvoiceStatus!
    billingPeriod: String!
    items: [InvoiceItem!]!
    subtotal: Int!
    tax: Int!
    total: Int!
    dueDate: DateTime!
    paidDate: DateTime
    paymentMethod: String!
    pdfUrl: String
    createdAt: DateTime!
  }

  enum InvoiceStatus {
    DRAFT
    ISSUED
    PAID
    OVERDUE
    CANCELLED
    REFUNDED
  }

  type InvoiceItem {
    description: String!
    quantity: Int!
    unitPrice: Int!
    total: Int!
    metadata: JSON
  }

  type PaymentMethod {
    id: ID!
    type: PaymentMethodType!
    lastFour: String
    brand: String
    expiryMonth: Int
    expiryYear: Int
    isDefault: Boolean!
    metadata: JSON
    createdAt: DateTime!
  }

  enum PaymentMethodType {
    CARD
    BANK_TRANSFER
    VIRTUAL_ACCOUNT
    WALLET
    SUBSCRIPTION
  }

  type SubscriptionStats {
    totalSubscriptions: Int!
    activeSubscriptions: Int!
    cancelledSubscriptions: Int!
    expiredSubscriptions: Int!
    revenueTotal: Int!
    revenueThisMonth: Int!
    revenueThisYear: Int!
    averageRevenuePerUser: Float!
    churnRate: Float!
    renewalRate: Float!
    byTier: [TierStats!]!
    byDuration: [DurationStats!]!
  }

  type TierStats {
    tier: SubscriptionTier!
    count: Int!
    percentage: Float!
    revenue: Int!
  }

  type DurationStats {
    duration: SubscriptionDuration!
    count: Int!
    percentage: Float!
    revenue: Int!
  }

  type UpgradeEligibility {
    eligible: Boolean!
    currentTier: SubscriptionTier!
    targetTier: SubscriptionTier!
    proratedAmount: Int!
    immediateUpgrade: Boolean!
    benefitsGained: [String!]!
    limitsIncreased: [String!]!
    upgradeDate: DateTime!
  }

  type SubscriptionHistory {
    id: ID!
    subscription: Subscription!
    action: SubscriptionAction!
    fromTier: SubscriptionTier
    toTier: SubscriptionTier
    fromStatus: SubscriptionStatus
    toStatus: SubscriptionStatus
    amount: Int
    metadata: JSON
    performedBy: User
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
  }

  enum SubscriptionAction {
    CREATE
    UPGRADE
    DOWNGRADE
    RENEW
    CANCEL
    SUSPEND
    REACTIVATE
    PAYMENT_SUCCESS
    PAYMENT_FAILED
    TRIAL_START
    TRIAL_END
  }

  type ChatAccessLevel {
    countries: [String!]!
    languages: [String!]!
    maxRooms: Int!
    canAnnounce: Boolean!
    canModerate: Boolean!
    premiumRooms: Boolean!
  }

  type PriorityLevel {
    jobPriority: Int!
    solutionPriority: Int!
    marketplacePriority: Int!
    searchPriority: Int!
    supportPriority: Int!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Current User
    mySubscription: Subscription
    mySubscriptionUsage: SubscriptionUsage!
    mySubscriptionBenefits: [SubscriptionBenefit!]!
    myInvoices(
      status: InvoiceStatus
      pagination: PaginationInput
    ): [Invoice!]!
    
    # Public
    subscriptionTiers: [SubscriptionTierDetail!]!
    subscriptionTier(tier: SubscriptionTier!): SubscriptionTierDetail!
    calculateUpgrade(
      targetTier: SubscriptionTier!
      prorated: Boolean
    ): UpgradeEligibility!
    
    # Admin
    allSubscriptions(
      filter: SubscriptionFilterInput
      pagination: PaginationInput
    ): SubscriptionConnection!
    
    subscriptionStats(
      startDate: DateTime
      endDate: DateTime
    ): SubscriptionStats!
    
    subscriptionHistory(
      subscriptionId: ID!
      pagination: PaginationInput
    ): [SubscriptionHistory!]!
    
    # Tier Management
    tierConfigurations: [SubscriptionTierDetail!]!
    tierConfiguration(tier: SubscriptionTier!): SubscriptionTierDetail!
  }

  type SubscriptionConnection {
    edges: [SubscriptionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SubscriptionEdge {
    node: Subscription!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Subscription Management
    subscribe(input: SubscribeInput!): Subscription!
    updateSubscription(input: UpdateSubscriptionInput!): Subscription!
    cancelSubscription(input: CancelSubscriptionInput!): MessageResponse!
    reactivateSubscription: Subscription!
    upgradeSubscription(input: UpgradeSubscriptionInput!): Subscription!
    downgradeSubscription(targetTier: SubscriptionTier!): Subscription!
    
    # Payment Methods
    addPaymentMethod(paymentMethodId: String!): PaymentMethod!
    updatePaymentMethod(paymentMethodId: String!, isDefault: Boolean!): PaymentMethod!
    removePaymentMethod(paymentMethodId: String!): MessageResponse!
    
    # Invoices
    payInvoice(invoiceId: ID!, paymentMethodId: String): Invoice!
    downloadInvoice(invoiceId: ID!): String!
    sendInvoiceEmail(invoiceId: ID!): MessageResponse!
    
    # Benefits Usage
    useBenefit(input: BenefitUsageInput!): SubscriptionUsage!
    resetBenefits: SubscriptionUsage!
    
    # Admin
    createTierConfiguration(input: TierConfigurationInput!): SubscriptionTierDetail!
    updateTierConfiguration(input: TierConfigurationInput!): SubscriptionTierDetail!
    deleteTierConfiguration(tier: SubscriptionTier!): MessageResponse!
    
    # User Management
    grantSubscription(
      userId: ID!
      tier: SubscriptionTier!
      duration: SubscriptionDuration!
      notes: String
    ): Subscription!
    
    revokeSubscription(subscriptionId: ID!, reason: String): MessageResponse!
    
    # Trial
    startTrial(tier: SubscriptionTier!): Subscription!
    extendTrial(days: Int!): Subscription!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    subscriptionUpdated: Subscription!
    invoiceGenerated: Invoice!
    benefitUsed(userId: ID!): SubscriptionBenefit!
    subscriptionExpiring: Subscription!
  }
`;

export default subscriptionTypeDef;