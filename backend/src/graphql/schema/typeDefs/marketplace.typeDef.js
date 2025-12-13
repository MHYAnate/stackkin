// apps/backend/src/graphql/schema/typeDefs/marketplace.typeDef.js

import { gql } from 'apollo-server-express';

export const marketplaceTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum ListingType {
    SELL
    BUY
    LEASE
    SERVICE
    BOUNTY
  }

  enum ListingCategory {
    SOFTWARE
    HARDWARE
    DOMAIN
    HOSTING
    API
    SAAS
    DESIGN
    DEVELOPMENT_SERVICE
    CONSULTING
    TRAINING
    OTHER
  }

  enum ListingCondition {
    NEW
    LIKE_NEW
    GOOD
    FAIR
    REFURBISHED
    NOT_APPLICABLE
  }

  enum ListingStatus {
    DRAFT
    PENDING_PAYMENT
    PENDING_REVIEW
    ACTIVE
    SOLD
    LEASED
    EXPIRED
    SUSPENDED
    CLOSED
  }

  enum TransactionStatus {
    PENDING
    ESCROW
    IN_PROGRESS
    COMPLETED
    DISPUTED
    REFUNDED
    CANCELLED
  }

  enum BountyStatus {
    OPEN
    IN_REVIEW
    AWARDED
    EXPIRED
    CANCELLED
  }

  enum ProposalStatus {
    PENDING
    ACCEPTED
    REJECTED
    COMPLETED
    CANCELLED
  }

  enum DisputeStatus {
    OPEN
    UNDER_REVIEW
    RESOLVED
    ESCALATED
    CLOSED
  }

  enum DeliveryMethod {
    DIGITAL_DOWNLOAD
    EMAIL
    API_ACCESS
    PHYSICAL_SHIPPING
    REMOTE_ACCESS
    IN_PERSON
    NOT_APPLICABLE
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateListingInput {
    title: String!
    description: String!
    shortDescription: String!
    type: ListingType!
    category: ListingCategory!
    
    # Pricing
    price: Float!
    currency: String!
    negotiable: Boolean
    minimumOffer: Float
    
    # For Lease
    leaseTerms: LeaseTermsInput
    
    # Details
    condition: ListingCondition
    specifications: [SpecificationInput!]
    features: [String!]
    
    # Delivery
    deliveryMethod: DeliveryMethod!
    deliveryTime: String
    
    # Media
    images: [String!]!
    documents: [DocumentInput!]
    demoUrl: String
    videoUrl: String
    
    # Tags & Location
    tags: [String!]
    location: String
    
    # Contact
    contactEmail: String!
    contactPhone: String
    
    # Settings
    allowOffers: Boolean
    hidePrice: Boolean
  }

  input UpdateListingInput {
    title: String
    description: String
    shortDescription: String
    type: ListingType
    category: ListingCategory
    price: Float
    currency: String
    negotiable: Boolean
    minimumOffer: Float
    leaseTerms: LeaseTermsInput
    condition: ListingCondition
    specifications: [SpecificationInput!]
    features: [String!]
    deliveryMethod: DeliveryMethod
    deliveryTime: String
    images: [String!]
    documents: [DocumentInput!]
    demoUrl: String
    videoUrl: String
    tags: [String!]
    location: String
    contactEmail: String
    contactPhone: String
    allowOffers: Boolean
    hidePrice: Boolean
  }

  input LeaseTermsInput {
    minimumDuration: String!
    maximumDuration: String
    pricePerPeriod: Float!
    period: LeasePeriod!
    deposit: Float
    renewalTerms: String
  }

  enum LeasePeriod {
    DAILY
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
  }

  input SpecificationInput {
    name: String!
    value: String!
  }

  input DocumentInput {
    name: String!
    url: String!
    type: String!
  }

  input CreateBountyInput {
    title: String!
    description: String!
    requirements: [String!]!
    deliverables: [String!]!
    techStack: [String!]!
    category: ListingCategory!
    
    # Budget
    budgetAmount: Float!
    currency: String!
    
    # Timeline
    deadline: DateTime!
    estimatedDuration: String
    
    # Settings
    maxProposals: Int
    isPrivate: Boolean
    requiresNDA: Boolean
    
    # Contact
    contactEmail: String!
    
    tags: [String!]
  }

  input UpdateBountyInput {
    title: String
    description: String
    requirements: [String!]
    deliverables: [String!]
    techStack: [String!]
    category: ListingCategory
    budgetAmount: Float
    currency: String
    deadline: DateTime
    estimatedDuration: String
    maxProposals: Int
    isPrivate: Boolean
    requiresNDA: Boolean
    contactEmail: String
    tags: [String!]
  }

  input SubmitProposalInput {
    bountyId: ID!
    coverLetter: String!
    proposedAmount: Float!
    estimatedDuration: String!
    approach: String!
    milestones: [MilestoneInput!]
    attachments: [DocumentInput!]
    portfolioLinks: [String!]
  }

  input MilestoneInput {
    title: String!
    description: String!
    amount: Float!
    duration: String!
    deliverables: [String!]!
  }

  input MakeOfferInput {
    listingId: ID!
    amount: Float!
    message: String!
    proposedTerms: String
  }

  input InitiateTransactionInput {
    listingId: ID!
    offerId: ID
    useEscrow: Boolean!
    notes: String
  }

  input ListingFilterInput {
    type: [ListingType!]
    category: [ListingCategory!]
    condition: [ListingCondition!]
    priceMin: Float
    priceMax: Float
    currency: String
    deliveryMethod: [DeliveryMethod!]
    isVerifiedSeller: Boolean
    isPremium: Boolean
    location: String
    search: String
    tags: [String!]
    sellerId: ID
    status: ListingStatus
    sortBy: ListingSortBy
    sortOrder: SortOrder
  }

  enum ListingSortBy {
    CREATED_AT
    PRICE
    VIEWS
    RELEVANCE
  }

  input BountyFilterInput {
    category: [ListingCategory!]
    techStack: [String!]
    budgetMin: Float
    budgetMax: Float
    currency: String
    deadlineWithin: Int # days
    isOpen: Boolean
    search: String
    posterId: ID
    sortBy: BountySortBy
    sortOrder: SortOrder
  }

  enum BountySortBy {
    CREATED_AT
    BUDGET
    DEADLINE
    PROPOSALS
  }

  # ==========================================
  # TYPES
  # ==========================================

  type MarketplaceListing {
    id: ID!
    title: String!
    slug: String!
    description: String!
    shortDescription: String!
    type: ListingType!
    category: ListingCategory!
    
    # Pricing
    price: Float!
    currency: String!
    negotiable: Boolean!
    minimumOffer: Float
    hidePrice: Boolean!
    
    # For Lease
    leaseTerms: LeaseTerms
    
    # Details
    condition: ListingCondition
    specifications: [Specification!]!
    features: [String!]!
    
    # Delivery
    deliveryMethod: DeliveryMethod!
    deliveryTime: String
    
    # Media
    images: [String!]!
    thumbnailImage: String
    documents: [Document!]!
    demoUrl: String
    videoUrl: String
    
    # Seller
    seller: User!
    
    # Status
    status: ListingStatus!
    isPremium: Boolean!
    isGloballyPinned: Boolean!
    
    # Pricing tier
    slotTier: SubscriptionTier!
    slotPrice: Float!
    paymentReference: String
    
    # Offers & Stats
    offers: [Offer!]!
    offersCount: Int!
    views: Int!
    saves: Int!
    
    # Tags & Location
    tags: [String!]!
    location: String
    
    # Contact
    contactEmail: String!
    contactPhone: String
    allowOffers: Boolean!
    
    # Timestamps
    publishedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type LeaseTerms {
    minimumDuration: String!
    maximumDuration: String
    pricePerPeriod: Float!
    period: LeasePeriod!
    deposit: Float
    renewalTerms: String
  }

  type Specification {
    name: String!
    value: String!
  }

  type Document {
    id: ID!
    name: String!
    url: String!
    type: String!
    uploadedAt: DateTime!
  }

  type Offer {
    id: ID!
    listing: MarketplaceListing!
    buyer: User!
    amount: Float!
    message: String!
    proposedTerms: String
    status: OfferStatus!
    sellerResponse: String
    respondedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
  }

  enum OfferStatus {
    PENDING
    ACCEPTED
    REJECTED
    COUNTER_OFFERED
    EXPIRED
    WITHDRAWN
  }

  type Bounty {
    id: ID!
    title: String!
    slug: String!
    description: String!
    requirements: [String!]!
    deliverables: [String!]!
    techStack: [String!]!
    category: ListingCategory!
    
    # Budget
    budgetAmount: Float!
    currency: String!
    escrowAmount: Float
    
    # Poster
    poster: User!
    
    # Timeline
    deadline: DateTime!
    estimatedDuration: String
    
    # Settings
    maxProposals: Int
    isPrivate: Boolean!
    requiresNDA: Boolean!
    
    # Status
    status: BountyStatus!
    
    # Proposals
    proposals: [Proposal!]!
    proposalsCount: Int!
    
    # Winner
    winner: User
    winningProposal: Proposal
    
    # Stats
    views: Int!
    
    # Contact & Tags
    contactEmail: String!
    tags: [String!]!
    
    # Escrow
    escrowStatus: EscrowStatus
    escrowReference: String
    
    # Timestamps
    awardedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum EscrowStatus {
    NOT_FUNDED
    FUNDED
    RELEASED
    REFUNDED
    DISPUTED
  }

  type Proposal {
    id: ID!
    bounty: Bounty!
    developer: User!
    coverLetter: String!
    proposedAmount: Float!
    estimatedDuration: String!
    approach: String!
    milestones: [Milestone!]!
    attachments: [Document!]!
    portfolioLinks: [String!]!
    status: ProposalStatus!
    posterFeedback: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Milestone {
    id: ID!
    title: String!
    description: String!
    amount: Float!
    duration: String!
    deliverables: [String!]!
    status: MilestoneStatus!
    completedAt: DateTime
  }

  enum MilestoneStatus {
    PENDING
    IN_PROGRESS
    SUBMITTED
    APPROVED
    REJECTED
  }

  type Transaction {
    id: ID!
    listing: MarketplaceListing
    bounty: Bounty
    buyer: User!
    seller: User!
    amount: Float!
    currency: String!
    fees: Float!
    netAmount: Float!
    status: TransactionStatus!
    useEscrow: Boolean!
    escrowStatus: EscrowStatus
    escrowReference: String
    paymentReference: String!
    notes: String
    dispute: Dispute
    completedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Dispute {
    id: ID!
    transaction: Transaction!
    raisedBy: User!
    reason: String!
    evidence: [Document!]!
    status: DisputeStatus!
    adminNotes: String
    resolution: String
    resolvedBy: User
    resolvedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ListingConnection {
    edges: [ListingEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ListingEdge {
    node: MarketplaceListing!
    cursor: String!
  }

  type BountyConnection {
    edges: [BountyEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BountyEdge {
    node: Bounty!
    cursor: String!
  }

  type ProposalConnection {
    edges: [ProposalEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProposalEdge {
    node: Proposal!
    cursor: String!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }

  type SlotPricing {
    tier: SubscriptionTier!
    price: Float!
    currency: String!
    freeSlotsRemaining: Int
    totalSlotsAllowed: Int
  }

  type ListingPaymentResult {
    success: Boolean!
    listing: MarketplaceListing
    paymentUrl: String
    paymentReference: String
    message: String!
  }

  type EscrowResult {
    success: Boolean!
    escrowReference: String
    paymentUrl: String
    message: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Listings
    listing(id: ID!): MarketplaceListing
    listingBySlug(slug: String!): MarketplaceListing
    listings(
      filter: ListingFilterInput
      pagination: PaginationInput
    ): ListingConnection!
    
    myListings(
      filter: ListingFilterInput
      pagination: PaginationInput
    ): ListingConnection!
    
    # Featured Listings
    featuredListings(limit: Int): [MarketplaceListing!]!
    premiumListings(pagination: PaginationInput): ListingConnection!
    
    # Bounties
    bounty(id: ID!): Bounty
    bountyBySlug(slug: String!): Bounty
    bounties(
      filter: BountyFilterInput
      pagination: PaginationInput
    ): BountyConnection!
    
    myBounties(pagination: PaginationInput): BountyConnection!
    
    # Proposals
    bountyProposals(
      bountyId: ID!
      pagination: PaginationInput
    ): ProposalConnection!
    myProposals(
      status: ProposalStatus
      pagination: PaginationInput
    ): ProposalConnection!
    
    # Offers
    listingOffers(listingId: ID!): [Offer!]!
    myOffers(status: OfferStatus): [Offer!]!
    receivedOffers(status: OfferStatus): [Offer!]!
    
    # Transactions
    transaction(id: ID!): Transaction
    myTransactions(
      status: TransactionStatus
      pagination: PaginationInput
    ): TransactionConnection!
    
    # Pricing
    listingSlotPrice: SlotPricing!
    
    # Search
    searchListings(
      query: String!
      filter: ListingFilterInput
      pagination: PaginationInput
    ): ListingConnection!
    
    searchBounties(
      query: String!
      filter: BountyFilterInput
      pagination: PaginationInput
    ): BountyConnection!
    
    # Similar Items
    similarListings(listingId: ID!, limit: Int): [MarketplaceListing!]!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Listings CRUD
    createListing(input: CreateListingInput!): ListingPaymentResult!
    updateListing(id: ID!, input: UpdateListingInput!): MarketplaceListing!
    deleteListing(id: ID!): MessageResponse!
    
    # Listing Actions
    publishListing(id: ID!): MarketplaceListing!
    closeListing(id: ID!): MarketplaceListing!
    markAsSold(id: ID!, buyerId: ID): MarketplaceListing!
    markAsLeased(id: ID!, lesseeId: ID): MarketplaceListing!
    
    # Listing Interactions
    viewListing(id: ID!): MarketplaceListing!
    saveListing(id: ID!): MessageResponse!
    unsaveListing(id: ID!): MessageResponse!
    
    # Offers
    makeOffer(input: MakeOfferInput!): Offer!
    acceptOffer(id: ID!): Offer!
    rejectOffer(id: ID!, reason: String): Offer!
    counterOffer(id: ID!, newAmount: Float!, message: String!): Offer!
    withdrawOffer(id: ID!): MessageResponse!
    
    # Bounties CRUD
    createBounty(input: CreateBountyInput!): Bounty!
    updateBounty(id: ID!, input: UpdateBountyInput!): Bounty!
    deleteBounty(id: ID!): MessageResponse!
    closeBounty(id: ID!): Bounty!
    
    # Bounty Escrow
    fundBountyEscrow(bountyId: ID!): EscrowResult!
    
    # Proposals
    submitProposal(input: SubmitProposalInput!): Proposal!
    withdrawProposal(id: ID!): MessageResponse!
    
    # Bounty Award
    awardBounty(bountyId: ID!, proposalId: ID!): Bounty!
    rejectProposal(id: ID!, feedback: String): Proposal!
    
    # Milestone Management
    startMilestone(milestoneId: ID!): Milestone!
    submitMilestone(milestoneId: ID!, deliveryNotes: String!): Milestone!
    approveMilestone(milestoneId: ID!): Milestone!
    rejectMilestone(milestoneId: ID!, reason: String!): Milestone!
    
    # Transactions
    initiateTransaction(input: InitiateTransactionInput!): Transaction!
    confirmDelivery(transactionId: ID!): Transaction!
    releaseEscrow(transactionId: ID!): Transaction!
    
    # Disputes
    raiseDispute(
      transactionId: ID!
      reason: String!
      evidence: [DocumentInput!]
    ): Dispute!
    respondToDispute(
      disputeId: ID!
      response: String!
      evidence: [DocumentInput!]
    ): Dispute!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    listingCreated(category: ListingCategory): MarketplaceListing!
    bountyCreated: Bounty!
    newProposal(bountyId: ID!): Proposal!
    newOffer(listingId: ID!): Offer!
    transactionUpdated(transactionId: ID!): Transaction!
    milestoneUpdated(bountyId: ID!): Milestone!
  }
`;

export default marketplaceTypeDef;