// apps/backend/src/graphql/schema/typeDefs/admin/marketplaceManagement.typeDef.js
import { gql } from 'apollo-server-express';

export const marketplaceManagementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum ListingStatus {
    DRAFT
    PENDING
    ACTIVE
    PAUSED
    SOLD
    EXPIRED
    SUSPENDED
    DELETED
    ARCHIVED
  }

  enum ListingType {
    PRODUCT
    SERVICE
    TEMPLATE
    PLUGIN
    THEME
    SCRIPT
    ASSET
    COURSE
    OTHER
  }

  enum TransactionStatus {
    PENDING
    PROCESSING
    COMPLETED
    CANCELLED
    REFUNDED
    DISPUTED
    FAILED
  }

  enum BountyStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
    CANCELLED
    EXPIRED
    DISPUTED
  }

  enum EscrowStatus {
    PENDING
    FUNDED
    IN_DISPUTE
    RELEASED
    REFUNDED
    CANCELLED
  }

  enum DisputeStatus {
    OPEN
    UNDER_REVIEW
    RESOLVED
    CANCELLED
  }

  enum MarketplaceAction {
    APPROVE
    REJECT
    SUSPEND
    UNSUSPEND
    FEATURE
    UNFEATURE
    VERIFY
    UNVERIFY
    PIN
    UNPIN
    EDIT
    REQUEST_CHANGES
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input MarketplaceFilterInput {
    # Basic Filters
    search: String
    title: String
    description: String
    
    # Status Filters
    status: ListingStatus
    type: ListingType
    
    # User Filters
    userId: ID
    username: String
    sellerVerified: Boolean
    sellerSubscriptionTier: SubscriptionTier
    
    # Category Filters
    category: String
    subcategory: String
    tags: [String!]
    techStack: [String!]
    
    # Price Filters
    minPrice: Int
    maxPrice: Int
    priceCurrency: Currency
    hasPrice: Boolean
    
    # Date Filters
    createdFrom: DateTime
    createdTo: DateTime
    expiresFrom: DateTime
    expiresTo: DateTime
    
    # Quality Filters
    featured: Boolean
    pinned: Boolean
    verified: Boolean
    premium: Boolean
    
    # Transaction Filters
    minSales: Int
    minRating: Float
    maxRating: Float
    hasTransactions: Boolean
  }

  input MarketplaceModerationInput {
    listingId: ID!
    action: MarketplaceAction!
    reason: String
    notes: String
    changes: JSON
    notifyUser: Boolean
    notificationMessage: String
  }

  input ListingEditInput {
    listingId: ID!
    title: String
    description: String
    category: String
    subcategory: String
    tags: [String!]
    techStack: [String!]
    price: Int
    priceCurrency: Currency
    salePrice: Int
    quantity: Int
    images: [String!]
    files: [String!]
    demoUrl: String
    documentationUrl: String
    supportInfo: String
    requirements: [String!]
    features: [String!]
    notes: String
  }

  input TransactionFilterInput {
    listingId: ID
    buyerId: ID
    sellerId: ID
    status: TransactionStatus
    paymentMethod: PaymentMethod
    minAmount: Int
    maxAmount: Int
    createdFrom: DateTime
    createdTo: DateTime
    search: String
  }

  input BountyFilterInput {
    status: BountyStatus
    creatorId: ID
    solverId: ID
    minBounty: Int
    maxBounty: Int
    category: String
    techStack: [String!]
    createdFrom: DateTime
    createdTo: DateTime
    search: String
  }

  input EscrowFilterInput {
    status: EscrowStatus
    buyerId: ID
    sellerId: ID
    listingId: ID
    bountyId: ID
    minAmount: Int
    maxAmount: Int
    createdFrom: DateTime
    createdTo: DateTime
  }

  input DisputeFilterInput {
    status: DisputeStatus
    escrowId: ID
    initiatorId: ID
    createdFrom: DateTime
    createdTo: DateTime
    severity: ReportSeverity
  }

  input CommissionConfigInput {
    platformFee: Float!
    paymentProcessingFee: Float!
    minimumCommission: Int!
    tieredCommission: JSON
    exemptCategories: [String!]
    exemptUsers: [ID!]
  }

  # ==========================================
  # TYPES
  # ==========================================

  type MarketplaceStats {
    # Counts
    totalListings: Int!
    newListingsToday: Int!
    newListingsThisWeek: Int!
    newListingsThisMonth: Int!
    
    # Status Breakdown
    activeListings: Int!
    pendingApproval: Int!
    soldListings: Int!
    expiredListings: Int!
    suspendedListings: Int!
    
    # Type Breakdown
    byType: [ListingTypeStats!]!
    byCategory: [CategoryStats!]!
    
    # Transactions
    totalTransactions: Int!
    completedTransactions: Int!
    disputedTransactions: Int!
    totalVolume: Int!
    averageTransactionValue: Int!
    
    # Bounties
    totalBounties: Int!
    openBounties: Int!
    completedBounties: Int!
    totalBountyValue: Int!
    
    # Financial
    platformRevenue: Int!
    pendingEscrow: Int!
    refundedAmount: Int!
    
    # Quality
    featuredListings: Int!
    verifiedListings: Int!
    premiumListings: Int!
    
    # Growth
    listingGrowthRate: Float!
    transactionGrowthRate: Float!
    revenueGrowthRate: Float!
  }

  type MarketplaceDetail {
    # Listing Info
    listing: MarketplaceListing!
    
    # Admin Data
    moderationHistory: [MarketplaceModerationLog!]!
    adminNotes: [AdminNote!]!
    verificationDetails: VerificationDetail
    featuredHistory: [FeaturedRecord!]!
    
    # Transactions
    transactions: [TransactionDetail!]!
    transactionStats: TransactionStats!
    
    # Performance
    analytics: MarketplaceAnalytics!
    engagement: MarketplaceEngagement!
    quality: MarketplaceQuality!
    
    # Related
    similarListings: [MarketplaceListing!]!
    sellerListings: [MarketplaceListing!]!
  }

  type MarketplaceModerationLog {
    id: ID!
    listing: MarketplaceListing!
    admin: Admin!
    action: MarketplaceAction!
    
    # Details
    reason: String
    notes: String
    changes: JSON
    ipAddress: String
    userAgent: String
    
    # Verification
    verificationChanged: Boolean
    verificationStatus: VerificationStatus
    
    # Notification
    notifiedUser: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type VerificationDetail {
    id: ID!
    listing: MarketplaceListing!
    verified: Boolean!
    verifiedBy: Admin!
    verifiedAt: DateTime!
    
    # Criteria
    criteria: [VerificationCriteria!]!
    score: Float!
    
    # Evidence
    evidence: [String!]
    notes: String
    
    # Expiry
    expiresAt: DateTime
    renewedAt: DateTime
    renewalCount: Int!
  }

  type VerificationCriteria {
    criterion: String!
    met: Boolean!
    score: Float!
    notes: String
  }

  type TransactionDetail {
    id: ID!
    listing: MarketplaceListing!
    buyer: User!
    seller: User!
    status: TransactionStatus!
    
    # Financial
    amount: Int!
    currency: Currency!
    platformFee: Int!
    paymentProcessingFee: Int!
    netAmount: Int!
    
    # Payment
    paymentMethod: PaymentMethod!
    paymentId: String!
    gatewayResponse: JSON
    
    # Escrow
    escrow: EscrowDetail
    escrowStatus: EscrowStatus
    
    # Delivery
    deliveryMethod: String
    trackingNumber: String
    deliveredAt: DateTime
    receivedAt: DateTime
    
    # Refunds
    refunded: Boolean!
    refundAmount: Int
    refundReason: String
    refundedAt: DateTime
    
    # Disputes
    disputed: Boolean!
    dispute: DisputeDetail
    
    # Ratings
    buyerRating: Rating
    sellerRating: Rating
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    completedAt: DateTime
  }

  type EscrowDetail {
    id: ID!
    transaction: TransactionDetail!
    bounty: BountyDetail
    amount: Int!
    currency: Currency!
    status: EscrowStatus!
    
    # Parties
    buyer: User!
    seller: User!
    admin: Admin
    
    # Terms
    terms: String!
    releaseConditions: JSON!
    
    # Payments
    payments: [PaymentRecord!]!
    releases: [EscrowRelease!]!
    
    # Dispute
    inDispute: Boolean!
    dispute: DisputeDetail
    
    # Timestamps
    createdAt: DateTime!
    fundedAt: DateTime
    releasedAt: DateTime
    expiresAt: DateTime!
  }

  type EscrowRelease {
    id: ID!
    escrow: EscrowDetail!
    amount: Int!
    to: User!
    reason: String!
    approvedBy: Admin!
    timestamp: DateTime!
  }

  type DisputeDetail {
    id: ID!
    escrow: EscrowDetail!
    initiator: User!
    reason: String!
    description: String!
    
    # Status
    status: DisputeStatus!
    resolution: DisputeResolution
    
    # Evidence
    evidence: [DisputeEvidence!]!
    
    # Resolution
    resolvedBy: Admin
    resolutionAmount: Int
    resolutionSplit: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    resolvedAt: DateTime
  }

  type DisputeEvidence {
    id: ID!
    dispute: DisputeDetail!
    user: User!
    type: DisputeEvidenceType!
    url: String!
    description: String
    uploadedAt: DateTime!
  }

  enum DisputeEvidenceType {
    IMAGE
    DOCUMENT
    VIDEO
    AUDIO
    CHAT_LOG
    CONTRACT
    SCREENSHOT
    OTHER
  }

  type DisputeResolution {
    winner: User
    amountToBuyer: Int
    amountToSeller: Int
    notes: String
    evidenceUsed: [String!]
  }

  type Rating {
    id: ID!
    transaction: TransactionDetail!
    rater: User!
    rated: User!
    rating: Int!
    comments: String
    categories: [String!]
    timestamp: DateTime!
  }

  type TransactionStats {
    totalTransactions: Int!
    completedTransactions: Int!
    pendingTransactions: Int!
    disputedTransactions: Int!
    refundedTransactions: Int!
    
    totalVolume: Int!
    averageTransactionValue: Int!
    platformRevenue: Int!
    
    successRate: Float!
    disputeRate: Float!
    refundRate: Float!
    
    averageRating: Float!
    responseRate: Float!
    completionRate: Float!
  }

  type MarketplaceAnalytics {
    # Views
    totalViews: Int!
    uniqueViews: Int!
    viewsToday: Int!
    viewsThisWeek: Int!
    viewsThisMonth: Int!
    
    # Engagement
    inquiries: Int!
    wishlistAdds: Int!
    shares: Int!
    saves: Int!
    
    # Conversion
    conversionRate: Float!
    averageTimeToSale: Int!
    cartAbandonmentRate: Float!
    
    # Sales
    totalSales: Int!
    salesToday: Int!
    salesThisWeek: Int!
    salesThisMonth: Int!
    
    # Financial
    revenue: Int!
    averageOrderValue: Int!
    repeatPurchaseRate: Float!
    
    # Quality
    returnRate: Float!
    disputeRate: Float!
    satisfactionScore: Float!
  }

  type MarketplaceEngagement {
    # User Engagement
    clickThroughRate: Float!
    inquiryRate: Float!
    wishlistRate: Float!
    
    # Social Engagement
    socialShares: Int!
    referralTraffic: Int!
    influencerMentions: Int!
    
    # Seller Engagement
    sellerResponseRate: Float!
    sellerResponseTime: Int!
    sellerActivityRate: Float!
    
    # Buyer Engagement
    buyerResponseRate: Float!
    buyerResponseTime: Int!
    buyerRetentionRate: Float!
  }

  type MarketplaceQuality {
    # Content Quality
    completeness: Float!
    accuracy: Float!
    clarity: Float!
    
    # Product/Service Quality
    qualityScore: Float!
    valueScore: Float!
    supportScore: Float!
    
    # Seller Quality
    sellerRating: Float!
    sellerResponseRate: Float!
    sellerCompletionRate: Float!
    
    # Transaction Quality
    transactionSuccessRate: Float!
    disputeResolutionRate: Float!
    satisfactionRate: Float!
  }

  type ListingTypeStats {
    type: ListingType!
    count: Int!
    sales: Int!
    revenue: Int!
    averagePrice: Int!
  }

  type CategoryStats {
    category: String!
    totalListings: Int!
    activeListings: Int!
    sales: Int!
    revenue: Int!
    averageRating: Float!
  }

  type BountyDetail {
    id: ID!
    creator: User!
    solver: User
    status: BountyStatus!
    
    # Details
    title: String!
    description: String!
    category: String!
    techStack: [String!]
    requirements: [String!]
    deliverables: [String!]
    
    # Financial
    bountyAmount: Int!
    currency: Currency!
    platformFee: Int!
    netAmount: Int!
    
    # Timeline
    deadline: DateTime!
    startedAt: DateTime
    completedAt: DateTime
    
    # Escrow
    escrow: EscrowDetail
    escrowStatus: EscrowStatus
    
    # Submissions
    submissions: [BountySubmission!]!
    acceptedSubmission: BountySubmission
    
    # Ratings
    creatorRating: Rating
    solverRating: Rating
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BountySubmission {
    id: ID!
    bounty: BountyDetail!
    solver: User!
    status: BountySubmissionStatus!
    
    # Content
    solution: String!
    attachments: [String!]
    demoUrl: String
    notes: String
    
    # Evaluation
    score: Float
    feedback: String
    reviewedBy: User
    reviewedAt: DateTime
    
    # Timestamps
    submittedAt: DateTime!
    updatedAt: DateTime!
  }

  enum BountySubmissionStatus {
    SUBMITTED
    UNDER_REVIEW
    ACCEPTED
    REJECTED
    REQUEST_REVISION
  }

  type CommissionConfig {
    id: ID!
    platformFee: Float!
    paymentProcessingFee: Float!
    minimumCommission: Int!
    tieredCommission: JSON!
    exemptCategories: [String!]!
    exemptUsers: [ID!]!
    
    # History
    changes: [CommissionChange!]!
    effectiveFrom: DateTime!
    effectiveTo: DateTime
    
    # Created
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CommissionChange {
    id: ID!
    config: CommissionConfig!
    changedBy: Admin!
    
    # Changes
    previousValues: JSON!
    newValues: JSON!
    reason: String!
    
    # Timestamps
    changedAt: DateTime!
  }

  type SellerPerformance {
    seller: User!
    
    # Stats
    totalListings: Int!
    activeListings: Int!
    soldListings: Int!
    totalSales: Int!
    
    # Financial
    totalRevenue: Int!
    averageSalePrice: Int!
    commissionPaid: Int!
    
    # Quality
    averageRating: Float!
    responseRate: Float!
    disputeRate: Float!
    refundRate: Float!
    
    # Growth
    salesGrowth: Float!
    revenueGrowth: Float!
    ratingGrowth: Float!
    
    # Risk
    riskScore: Float!
    warningCount: Int!
    suspensionCount: Int!
  }

  type BuyerPerformance {
    buyer: User!
    
    # Stats
    totalPurchases: Int!
    totalSpent: Int!
    averagePurchaseValue: Int!
    
    # Behavior
    purchaseFrequency: Float!
    cartAbandonmentRate: Float!
    returnRate: Float!
    
    # Quality
    ratingGiven: Float!
    disputeRate: Float!
    completionRate: Float!
    
    # Loyalty
    repeatPurchaseRate: Float!
    loyaltyScore: Float!
    referralCount: Int!
  }

  type MarketplaceDashboard {
    # Overview
    stats: MarketplaceStats!
    
    # Recent Activity
    recentListings: [MarketplaceDetail!]!
    recentTransactions: [TransactionDetail!]!
    recentModerations: [MarketplaceModerationLog!]!
    
    # Pending Actions
    pendingApprovals: [MarketplaceListing!]!
    pendingEscrows: [EscrowDetail!]!
    pendingDisputes: [DisputeDetail!]!
    pendingBounties: [BountyDetail!]!
    
    # Performance
    topSelling: [MarketplaceDetail!]!
    topSellers: [SellerPerformance!]!
    topBuyers: [BuyerPerformance!]!
    
    # Financial
    revenueBreakdown: RevenueBreakdown!
    commissionAnalysis: CommissionAnalysis!
    
    # Generated At
    generatedAt: DateTime!
  }

  type RevenueBreakdown {
    byCategory: [CategoryRevenue!]!
    byType: [TypeRevenue!]!
    byPeriod: [PeriodRevenue!]!
    bySellerTier: [TierRevenue!]!
  }

  type CategoryRevenue {
    category: String!
    revenue: Int!
    percentage: Float!
    growth: Float!
  }

  type TypeRevenue {
    type: ListingType!
    revenue: Int!
    percentage: Float!
    growth: Float!
  }

  type PeriodRevenue {
    period: String!
    revenue: Int!
    transactions: Int!
    averageValue: Int!
  }

  type TierRevenue {
    tier: SubscriptionTier!
    revenue: Int!
    percentage: Float!
    sellerCount: Int!
  }

  type CommissionAnalysis {
    totalCommission: Int!
    platformFeeRevenue: Int!
    paymentProcessingRevenue: Int!
    netRevenue: Int!
    
    byCategory: [CategoryCommission!]!
    byTier: [TierCommission!]!
    trends: [CommissionTrend!]!
  }

  type CategoryCommission {
    category: String!
    commission: Int!
    percentage: Float!
    averageRate: Float!
  }

  type TierCommission {
    tier: SubscriptionTier!
    commission: Int!
    percentage: Float!
    averageRate: Float!
  }

  type CommissionTrend {
    date: DateTime!
    commission: Int!
    transactions: Int!
    averageRate: Float!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Marketplace Management
    marketplaceStats: MarketplaceStats!
    marketplaceDashboard: MarketplaceDashboard!
    
    listings(
      filter: MarketplaceFilterInput
      pagination: PaginationInput
      sort: MarketplaceSortInput
    ): MarketplaceConnection!
    
    listingDetail(listingId: ID!): MarketplaceDetail!
    
    # Transactions
    transactions(
      filter: TransactionFilterInput
      pagination: PaginationInput
    ): TransactionConnection!
    
    transactionDetail(transactionId: ID!): TransactionDetail!
    
    # Bounties
    bounties(
      filter: BountyFilterInput
      pagination: PaginationInput
    ): [BountyDetail!]!
    
    bountyDetail(bountyId: ID!): BountyDetail!
    
    # Escrows
    escrows(
      filter: EscrowFilterInput
      pagination: PaginationInput
    ): [EscrowDetail!]!
    
    escrowDetail(escrowId: ID!): EscrowDetail!
    
    # Disputes
    disputes(
      filter: DisputeFilterInput
      pagination: PaginationInput
    ): [DisputeDetail!]!
    
    disputeDetail(disputeId: ID!): DisputeDetail!
    
    # Performance
    sellerPerformance(sellerId: ID!): SellerPerformance!
    buyerPerformance(buyerId: ID!): BuyerPerformance!
    
    topSellers(limit: Int): [SellerPerformance!]!
    topBuyers(limit: Int): [BuyerPerformance!]!
    
    # Commission
    commissionConfig: CommissionConfig!
    commissionHistory(pagination: PaginationInput): [CommissionChange!]!
    
    # Moderation
    moderationHistory(
      listingId: ID
      action: MarketplaceAction
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [MarketplaceModerationLog!]!
    
    # Analytics
    marketplaceAnalytics(
      listingId: ID
      startDate: DateTime
      endDate: DateTime
      groupBy: GroupBy
    ): [MarketplaceAnalytics!]!
  }

  input MarketplaceSortInput {
    field: MarketplaceSortField!
    order: SortOrder!
  }

  enum MarketplaceSortField {
    CREATED_AT
    UPDATED_AT
    PRICE
    SALES
    VIEWS
    RATING
    REVENUE
  }

  type MarketplaceConnection {
    edges: [MarketplaceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    stats: MarketplaceStats!
  }

  type MarketplaceEdge {
    node: MarketplaceListing!
    cursor: String!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TransactionEdge {
    node: TransactionDetail!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Listing Moderation
    moderateListing(input: MarketplaceModerationInput!): MarketplaceModerationLog!
    editListing(input: ListingEditInput!): MarketplaceListing!
    
    # Status Management
    approveListing(listingId: ID!, reason: String, notifyUser: Boolean): MarketplaceListing!
    rejectListing(listingId: ID!, reason: String!, notifyUser: Boolean): MarketplaceListing!
    suspendListing(listingId: ID!, reason: String!, duration: Int, notifyUser: Boolean): MarketplaceListing!
    unsuspendListing(listingId: ID!, reason: String, notifyUser: Boolean): MarketplaceListing!
    featureListing(listingId: ID!, reason: String, notifyUser: Boolean): MarketplaceListing!
    unfeatureListing(listingId: ID!, reason: String): MarketplaceListing!
    verifyListing(listingId: ID!, criteria: [VerificationCriteriaInput!]!, notes: String): VerificationDetail!
    unverifyListing(listingId: ID!, reason: String!): MarketplaceListing!
    pinListing(listingId: ID!, reason: String, notifyUser: Boolean): MarketplaceListing!
    unpinListing(listingId: ID!, reason: String): MarketplaceListing!
    
    # Transaction Management
    updateTransactionStatus(transactionId: ID!, status: TransactionStatus!, reason: String): TransactionDetail!
    processRefund(transactionId: ID!, amount: Int!, reason: String!): TransactionDetail!
    cancelRefund(refundId: ID!, reason: String!): TransactionDetail!
    
    # Escrow Management
    manageEscrow(escrowId: ID!, action: EscrowAction!, amount: Int, reason: String): EscrowDetail!
    releaseEscrow(escrowId: ID!, amount: Int!, toUserId: ID!, reason: String): EscrowRelease!
    refundEscrow(escrowId: ID!, reason: String!): EscrowDetail!
    
    # Dispute Resolution
    createDispute(escrowId: ID!, initiatorId: ID!, reason: String!, description: String!): DisputeDetail!
    addDisputeEvidence(disputeId: ID!, type: DisputeEvidenceType!, url: String!, description: String): DisputeEvidence!
    resolveDispute(disputeId: ID!, resolution: JSON!): DisputeDetail!
    
    # Bounty Management
    moderateBounty(bountyId: ID!, action: BountyAction!, reason: String): BountyDetail!
    reviewSubmission(submissionId: ID!, accept: Boolean!, feedback: String, score: Float): BountySubmission!
    releaseBounty(bountyId: ID!, submissionId: ID!, reason: String): BountyDetail!
    
    # Commission Management
    updateCommissionConfig(input: CommissionConfigInput!): CommissionConfig!
    overrideCommission(transactionId: ID!, commission: Float!, reason: String): TransactionDetail!
    
    # Performance Management
    flagSeller(sellerId: ID!, reason: String!, severity: SeverityLevel!): SellerPerformance!
    warnSeller(sellerId: ID!, reason: String!, points: Int): SellerPerformance!
    suspendSeller(sellerId: ID!, reason: String!, duration: Int): SellerPerformance!
    
    flagBuyer(buyerId: ID!, reason: String!, severity: SeverityLevel!): BuyerPerformance!
    warnBuyer(buyerId: ID!, reason: String!, points: Int): BuyerPerformance!
    suspendBuyer(buyerId: ID!, reason: String!, duration: Int): BuyerPerformance!
    
    # Communication
    notifySeller(sellerId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
    notifyBuyer(buyerId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
    notifyTransactionParties(transactionId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
  }

  input VerificationCriteriaInput {
    criterion: String!
    met: Boolean!
    score: Float!
    notes: String
  }

  enum EscrowAction {
    CREATE
    FUND
    RELEASE
    REFUND
    CANCEL
  }

  enum BountyAction {
    APPROVE
    REJECT
    SUSPEND
    CANCEL
    EXTEND
    ESCALATE
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    listingModerated: MarketplaceModerationLog!
    transactionUpdated(transactionId: ID!): TransactionDetail!
    escrowUpdated(escrowId: ID!): EscrowDetail!
    disputeCreated: DisputeDetail!
    bountyUpdated(bountyId: ID!): BountyDetail!
  }
`;

export default marketplaceManagementTypeDef;