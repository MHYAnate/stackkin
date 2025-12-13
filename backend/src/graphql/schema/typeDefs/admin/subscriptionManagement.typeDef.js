// apps/backend/src/graphql/schema/typeDefs/admin/subscriptionManagement.typeDef.js

import { gql } from 'apollo-server-express';

const subscriptionManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================

  enum SubscriptionTier {
    FREE
    BASE
    MID
    TOP
  }

  enum SubscriptionStatus {
    ACTIVE
    EXPIRED
    CANCELLED
    SUSPENDED
    PENDING
    GRACE_PERIOD
  }

  enum SubscriptionDuration {
    HALF_YEARLY
    YEARLY
    LIFETIME
  }

  enum PaymentStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  enum RefundReason {
    USER_REQUEST
    SERVICE_ISSUE
    DUPLICATE_PAYMENT
    FRAUD
    UPGRADE_CREDIT
    ADMIN_DECISION
    OTHER
  }

  enum SubscriptionSortField {
    CREATED_AT
    EXPIRES_AT
    TIER
    STATUS
    AMOUNT_PAID
  }

  enum CouponType {
    PERCENTAGE
    FIXED_AMOUNT
    FREE_TRIAL
    TIER_UPGRADE
  }

  # ============================================
  # TYPES
  # ============================================

  type SubscriptionPlan {
    id: ID!
    tier: SubscriptionTier!
    duration: SubscriptionDuration!
    name: String!
    description: String!
    
    # Pricing (in Kobo)
    price: Int!
    originalPrice: Int
    discountPercentage: Float
    
    # Features
    features: SubscriptionFeatures!
    
    # Limits
    jobPostings: Int!
    marketplaceSlots: Int!
    chatRoomAccess: ChatAccessLevel!
    talentPoolAccess: Boolean!
    announcementPrivileges: Boolean!
    
    # Meta
    isPopular: Boolean!
    isActive: Boolean!
    displayOrder: Int!
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SubscriptionFeatures {
    prioritySolutionVisibility: Boolean!
    premiumBadge: Boolean!
    mentorshipAccess: Boolean!
    advertisingCredits: Int!
    supportPriority: String!
    customProfileThemes: Boolean!
    analyticsAccess: Boolean!
    apiAccess: Boolean!
  }

  type ChatAccessLevel {
    ownCountry: Boolean!
    multipleCountries: Int!
    languageRooms: Int!
    premiumRooms: Boolean!
    unlimitedAccess: Boolean!
  }

  type UserSubscription {
    id: ID!
    user: User!
    plan: SubscriptionPlan!
    tier: SubscriptionTier!
    status: SubscriptionStatus!
    
    # Dates
    startDate: DateTime!
    endDate: DateTime
    cancelledAt: DateTime
    
    # Payment
    amountPaid: Int!
    currency: String!
    paymentMethod: String
    paymentReference: String
    zainpayTransactionId: String
    
    # Usage Tracking
    jobPostingsUsed: Int!
    marketplaceSlotsUsed: Int!
    
    # Auto-renewal
    autoRenew: Boolean!
    renewalReminderSent: Boolean!
    
    # Grace Period
    isInGracePeriod: Boolean!
    gracePeriodEnds: DateTime
    
    # History
    upgradeHistory: [SubscriptionUpgrade!]!
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SubscriptionUpgrade {
    id: ID!
    fromTier: SubscriptionTier!
    toTier: SubscriptionTier!
    proratedAmount: Int!
    upgradeDate: DateTime!
    reason: String
  }

  type SubscriptionPayment {
    id: ID!
    subscription: UserSubscription!
    user: User!
    amount: Int!
    currency: String!
    status: PaymentStatus!
    
    # Zainpay Details
    zainpayRef: String
    zainpayTxnRef: String
    paymentMethod: String
    
    # Timestamps
    initiatedAt: DateTime!
    completedAt: DateTime
    failedAt: DateTime
    failureReason: String
    
    # Refund Info
    isRefunded: Boolean!
    refundAmount: Int
    refundReason: RefundReason
    refundedAt: DateTime
    refundedBy: Admin
  }

  type SubscriptionCoupon {
    id: ID!
    code: String!
    type: CouponType!
    value: Float!
    
    # Applicability
    applicableTiers: [SubscriptionTier!]!
    applicableDurations: [SubscriptionDuration!]!
    
    # Limits
    maxUses: Int
    usedCount: Int!
    maxUsesPerUser: Int!
    
    # Validity
    validFrom: DateTime!
    validUntil: DateTime!
    isActive: Boolean!
    
    # Restrictions
    minimumAmount: Int
    firstTimeUsersOnly: Boolean!
    
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SubscriptionStats {
    # Overview
    totalActiveSubscriptions: Int!
    totalRevenue: Int!
    monthlyRecurringRevenue: Int!
    averageRevenuePerUser: Float!
    
    # By Tier
    tierBreakdown: [TierStats!]!
    
    # Trends
    newSubscriptionsToday: Int!
    newSubscriptionsThisWeek: Int!
    newSubscriptionsThisMonth: Int!
    
    # Churn
    churnRate: Float!
    cancelledThisMonth: Int!
    expiredThisMonth: Int!
    
    # Conversion
    freeToBasicConversionRate: Float!
    upgradeRate: Float!
    downgradeRate: Float!
    
    # Revenue
    revenueToday: Int!
    revenueThisWeek: Int!
    revenueThisMonth: Int!
    revenueGrowth: Float!
    
    # Refunds
    totalRefunds: Int!
    refundRate: Float!
  }

  type TierStats {
    tier: SubscriptionTier!
    activeCount: Int!
    revenue: Int!
    percentageOfTotal: Float!
    averageLifetimeValue: Float!
    churnRate: Float!
  }

  type SubscriptionRevenue {
    period: String!
    revenue: Int!
    subscriptionCount: Int!
    averageValue: Float!
    tierBreakdown: [TierRevenue!]!
  }

  type TierRevenue {
    tier: SubscriptionTier!
    revenue: Int!
    count: Int!
  }

  type ExpiringSubscription {
    subscription: UserSubscription!
    daysUntilExpiry: Int!
    user: User!
    renewalLikelihood: String!
  }

  # ============================================
  # INPUTS
  # ============================================

  input SubscriptionFilterInput {
    tier: [SubscriptionTier!]
    status: [SubscriptionStatus!]
    dateFrom: DateTime
    dateTo: DateTime
    searchTerm: String
    autoRenew: Boolean
    expiringWithinDays: Int
  }

  input SubscriptionListInput {
    filter: SubscriptionFilterInput
    sortBy: SubscriptionSortField
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input CreateSubscriptionPlanInput {
    tier: SubscriptionTier!
    duration: SubscriptionDuration!
    name: String!
    description: String!
    price: Int!
    originalPrice: Int
    jobPostings: Int!
    marketplaceSlots: Int!
    features: SubscriptionFeaturesInput!
    chatAccess: ChatAccessInput!
    talentPoolAccess: Boolean!
    announcementPrivileges: Boolean!
    isActive: Boolean!
    displayOrder: Int!
  }

  input UpdateSubscriptionPlanInput {
    planId: ID!
    name: String
    description: String
    price: Int
    originalPrice: Int
    jobPostings: Int
    marketplaceSlots: Int
    features: SubscriptionFeaturesInput
    chatAccess: ChatAccessInput
    isActive: Boolean
    displayOrder: Int
  }

  input SubscriptionFeaturesInput {
    prioritySolutionVisibility: Boolean
    premiumBadge: Boolean
    mentorshipAccess: Boolean
    advertisingCredits: Int
    supportPriority: String
    customProfileThemes: Boolean
    analyticsAccess: Boolean
    apiAccess: Boolean
  }

  input ChatAccessInput {
    ownCountry: Boolean
    multipleCountries: Int
    languageRooms: Int
    premiumRooms: Boolean
    unlimitedAccess: Boolean
  }

  input GrantSubscriptionInput {
    userId: ID!
    tier: SubscriptionTier!
    duration: SubscriptionDuration!
    reason: String!
    isFree: Boolean!
    expiresAt: DateTime
  }

  input ExtendSubscriptionInput {
    subscriptionId: ID!
    additionalDays: Int!
    reason: String!
  }

  input ProcessRefundInput {
    paymentId: ID!
    amount: Int!
    reason: RefundReason!
    note: String
  }

  input CreateCouponInput {
    code: String!
    type: CouponType!
    value: Float!
    applicableTiers: [SubscriptionTier!]!
    applicableDurations: [SubscriptionDuration!]!
    maxUses: Int
    maxUsesPerUser: Int!
    validFrom: DateTime!
    validUntil: DateTime!
    minimumAmount: Int
    firstTimeUsersOnly: Boolean!
  }

  input UpdateCouponInput {
    couponId: ID!
    maxUses: Int
    validUntil: DateTime
    isActive: Boolean
  }

  input RevenueReportInput {
    startDate: DateTime!
    endDate: DateTime!
    groupBy: String!
    tiers: [SubscriptionTier!]
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Plans
    subscriptionPlans(activeOnly: Boolean): [SubscriptionPlan!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    subscriptionPlan(id: ID!): SubscriptionPlan @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Subscriptions
    subscriptions(input: SubscriptionListInput!): PaginatedSubscriptions! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    subscription(id: ID!): UserSubscription @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    userSubscriptionHistory(userId: ID!): [UserSubscription!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Payments
    subscriptionPayments(subscriptionId: ID, status: PaymentStatus, limit: Int): [SubscriptionPayment!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    payment(id: ID!): SubscriptionPayment @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Stats
    subscriptionStats(dateFrom: DateTime, dateTo: DateTime): SubscriptionStats! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    subscriptionRevenue(input: RevenueReportInput!): [SubscriptionRevenue!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Expiring
    expiringSubscriptions(withinDays: Int!): [ExpiringSubscription!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Coupons
    coupons(activeOnly: Boolean): [SubscriptionCoupon!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    coupon(id: ID!): SubscriptionCoupon @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    couponUsage(couponId: ID!): [UserSubscription!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Search
    searchSubscriptions(query: String!, limit: Int): [UserSubscription!]! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
  }

  type PaginatedSubscriptions {
    subscriptions: [UserSubscription!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Plan Management
    createSubscriptionPlan(input: CreateSubscriptionPlanInput!): SubscriptionPlan! @auth(requires: [SUPER_ADMIN])
    updateSubscriptionPlan(input: UpdateSubscriptionPlanInput!): SubscriptionPlan! @auth(requires: [SUPER_ADMIN])
    togglePlanStatus(planId: ID!): SubscriptionPlan! @auth(requires: [SUPER_ADMIN])
    
    # Subscription Management
    grantSubscription(input: GrantSubscriptionInput!): UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    extendSubscription(input: ExtendSubscriptionInput!): UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    cancelSubscription(subscriptionId: ID!, reason: String!): UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    suspendSubscription(subscriptionId: ID!, reason: String!): UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    reactivateSubscription(subscriptionId: ID!): UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Payment & Refunds
    processRefund(input: ProcessRefundInput!): SubscriptionPayment! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    retryPayment(paymentId: ID!): SubscriptionPayment! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Coupons
    createCoupon(input: CreateCouponInput!): SubscriptionCoupon! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    updateCoupon(input: UpdateCouponInput!): SubscriptionCoupon! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    deactivateCoupon(couponId: ID!): SubscriptionCoupon! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    
    # Bulk Actions
    sendRenewalReminders(daysBeforeExpiry: Int!): Int! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    processExpiredSubscriptions: Int! @auth(requires: [SUPER_ADMIN])
    
    # Migration
    migrateSubscriptions(fromPlanId: ID!, toPlanId: ID!, reason: String!): Int! @auth(requires: [SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    newSubscription: UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    subscriptionStatusChanged: UserSubscription! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    paymentReceived: SubscriptionPayment! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
    refundProcessed: SubscriptionPayment! @auth(requires: [SUBSCRIPTION_ADMIN, SUPER_ADMIN])
  }
`;

export default subscriptionManagementTypeDef;