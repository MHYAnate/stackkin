// apps/backend/src/graphql/schema/typeDefs/solution.typeDef.js

import { gql } from 'apollo-server-express';

export const solutionTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum SolutionType {
    APPLICATION
    DEV_TOOL
    INTEGRATION
    TUTORIAL
    LIBRARY
    FRAMEWORK
    API
    PLUGIN
    TEMPLATE
    BOUNTY
    OTHER
  }

  enum SolutionStatus {
    DRAFT
    PENDING_REVIEW
    PUBLISHED
    REJECTED
    ARCHIVED
    SUSPENDED
  }

  enum SolutionVisibility {
    PUBLIC
    UNLISTED
    PRIVATE
  }

  enum PricingModel {
    FREE
    FREEMIUM
    PAID
    SUBSCRIPTION
    ONE_TIME
    CONTACT_FOR_PRICING
  }

  enum ComplaintStatus {
    PENDING
    UNDER_REVIEW
    RESOLVED
    DISMISSED
  }

  enum ComplaintType {
    SPAM
    INAPPROPRIATE_CONTENT
    COPYRIGHT_VIOLATION
    MISLEADING_INFORMATION
    BROKEN_LINKS
    SECURITY_CONCERN
    OTHER
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateSolutionInput {
    title: String!
    description: String!
    shortDescription: String!
    category: ID!
    type: SolutionType!
    techStack: [String!]!
    useCases: [String!]!
    
    # Optional fields
    documentationUrl: String
    demoUrl: String
    repositoryUrl: String
    websiteUrl: String
    videoUrl: String
    
    # Attachments
    images: [String!]
    attachments: [AttachmentInput!]
    
    # Contact & Pricing
    contactEmail: String!
    contactPhone: String
    pricingModel: PricingModel!
    price: Float
    currency: String
    
    # Metadata
    tags: [String!]
    features: [String!]
    requirements: [String!]
    
    # Settings
    visibility: SolutionVisibility
    allowComments: Boolean
    allowRatings: Boolean
  }

  input UpdateSolutionInput {
    title: String
    description: String
    shortDescription: String
    category: ID
    type: SolutionType
    techStack: [String!]
    useCases: [String!]
    documentationUrl: String
    demoUrl: String
    repositoryUrl: String
    websiteUrl: String
    videoUrl: String
    images: [String!]
    attachments: [AttachmentInput!]
    contactEmail: String
    contactPhone: String
    pricingModel: PricingModel
    price: Float
    currency: String
    tags: [String!]
    features: [String!]
    requirements: [String!]
    visibility: SolutionVisibility
    allowComments: Boolean
    allowRatings: Boolean
  }

  input AttachmentInput {
    name: String!
    url: String!
    type: String!
    size: Int!
  }

  input RatingSolutionInput {
    solutionId: ID!
    rating: Int!
    comment: String!
    pros: [String!]
    cons: [String!]
  }

  input UpdateRatingInput {
    rating: Int
    comment: String
    pros: [String!]
    cons: [String!]
  }

  input ComplaintInput {
    solutionId: ID!
    type: ComplaintType!
    description: String!
    evidence: [String!]
  }

  input SolutionFilterInput {
    category: ID
    categories: [ID!]
    type: SolutionType
    types: [SolutionType!]
    techStack: [String!]
    pricingModel: PricingModel
    minRating: Float
    maxRating: Float
    isPremium: Boolean
    isVerifiedAuthor: Boolean
    authorId: ID
    search: String
    tags: [String!]
    status: SolutionStatus
    visibility: SolutionVisibility
    createdAfter: DateTime
    createdBefore: DateTime
    sortBy: SolutionSortBy
    sortOrder: SortOrder
  }

  enum SolutionSortBy {
    CREATED_AT
    UPDATED_AT
    RATING
    VIEWS
    TITLE
    RELEVANCE
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Solution {
    id: ID!
    title: String!
    slug: String!
    description: String!
    shortDescription: String!
    
    # Classification
    category: Category!
    type: SolutionType!
    techStack: [String!]!
    useCases: [String!]!
    tags: [String!]!
    features: [String!]!
    requirements: [String!]!
    
    # Links
    documentationUrl: String
    demoUrl: String
    repositoryUrl: String
    websiteUrl: String
    videoUrl: String
    
    # Media
    images: [String!]!
    thumbnailImage: String
    attachments: [Attachment!]!
    
    # Contact & Pricing
    contactEmail: String!
    contactPhone: String
    pricingModel: PricingModel!
    price: Float
    currency: String
    
    # Author
    author: User!
    
    # Status & Settings
    status: SolutionStatus!
    visibility: SolutionVisibility!
    isPremium: Boolean!
    isFeatured: Boolean!
    isTopRated: Boolean!
    allowComments: Boolean!
    allowRatings: Boolean!
    
    # Ratings & Reviews
    ratings: [Rating!]!
    ratingsCount: Int!
    averageRating: Float!
    ratingBreakdown: RatingBreakdown!
    
    # Stats
    views: Int!
    clicks: Int!
    shares: Int!
    saves: Int!
    
    # Moderation
    complaints: [Complaint!]!
    complaintsCount: Int!
    
    # Timestamps
    publishedAt: DateTime
    lastActivityAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Attachment {
    id: ID!
    name: String!
    url: String!
    type: String!
    size: Int!
    uploadedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    icon: String
    color: String
    parentCategory: Category
    subCategories: [Category!]!
    solutionsCount: Int!
    isActive: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Rating {
    id: ID!
    solution: Solution!
    user: User!
    rating: Int!
    comment: String!
    pros: [String!]!
    cons: [String!]!
    isVerifiedPurchase: Boolean!
    helpfulCount: Int!
    reportedCount: Int!
    isEdited: Boolean!
    authorResponse: String
    authorRespondedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RatingBreakdown {
    fiveStars: Int!
    fourStars: Int!
    threeStars: Int!
    twoStars: Int!
    oneStar: Int!
  }

  type Complaint {
    id: ID!
    solution: Solution!
    reporter: User!
    type: ComplaintType!
    description: String!
    evidence: [String!]!
    status: ComplaintStatus!
    adminNotes: String
    resolvedBy: User
    resolvedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SolutionConnection {
    edges: [SolutionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SolutionEdge {
    node: Solution!
    cursor: String!
  }

  type CategoryConnection {
    edges: [CategoryEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CategoryEdge {
    node: Category!
    cursor: String!
  }

  type RatingConnection {
    edges: [RatingEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type RatingEdge {
    node: Rating!
    cursor: String!
  }

  type TopSolution {
    rank: Int!
    solution: Solution!
    periodStart: DateTime!
    periodEnd: DateTime!
  }

  type PremiumUpgradeResult {
    success: Boolean!
    solution: Solution!
    paymentReference: String
    message: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Solutions
    solution(id: ID!): Solution
    solutionBySlug(slug: String!): Solution
    solutions(
      filter: SolutionFilterInput
      pagination: PaginationInput
    ): SolutionConnection!
    
    mySolutions(
      filter: SolutionFilterInput
      pagination: PaginationInput
    ): SolutionConnection!
    
    # Featured & Top Solutions
    featuredSolutions(limit: Int): [Solution!]!
    topSolutions(
      categoryId: ID
      limit: Int
    ): [TopSolution!]!
    premiumSolutions(
      categoryId: ID
      pagination: PaginationInput
    ): SolutionConnection!
    
    # Categories
    categories(parentId: ID): [Category!]!
    category(id: ID!): Category
    categoryBySlug(slug: String!): Category
    
    # Ratings
    solutionRatings(
      solutionId: ID!
      pagination: PaginationInput
    ): RatingConnection!
    myRatings(pagination: PaginationInput): RatingConnection!
    
    # Search & Suggestions
    searchSolutions(
      query: String!
      filter: SolutionFilterInput
      pagination: PaginationInput
    ): SolutionConnection!
    suggestedSolutions(solutionId: ID!, limit: Int): [Solution!]!
    trendingTags(limit: Int): [String!]!
    
    # Stats
    solutionStats(solutionId: ID!): SolutionStats!
    categoryStats(categoryId: ID!): CategoryStats!
  }

  type SolutionStats {
    totalViews: Int!
    uniqueViews: Int!
    totalClicks: Int!
    totalShares: Int!
    totalSaves: Int!
    averageRating: Float!
    totalRatings: Int!
    viewsByDay: [DailyStat!]!
    clicksByDay: [DailyStat!]!
    topReferrers: [ReferrerStat!]!
  }

  type CategoryStats {
    totalSolutions: Int!
    totalViews: Int!
    averageRating: Float!
    topSolutions: [Solution!]!
    trendingTags: [String!]!
  }

  type DailyStat {
    date: DateTime!
    count: Int!
  }

  type ReferrerStat {
    source: String!
    count: Int!
    percentage: Float!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Solutions CRUD
    createSolution(input: CreateSolutionInput!): Solution!
    updateSolution(id: ID!, input: UpdateSolutionInput!): Solution!
    deleteSolution(id: ID!): MessageResponse!
    
    # Solution Actions
    publishSolution(id: ID!): Solution!
    unpublishSolution(id: ID!): Solution!
    archiveSolution(id: ID!): Solution!
    
    # Premium Upgrade (requires payment)
    upgradeToPremium(solutionId: ID!): PremiumUpgradeResult!
    
    # Interactions
    viewSolution(id: ID!): Solution!
    saveSolution(id: ID!): MessageResponse!
    unsaveSolution(id: ID!): MessageResponse!
    shareSolution(id: ID!, platform: String): MessageResponse!
    
    # Ratings
    rateSolution(input: RatingSolutionInput!): Rating!
    updateRating(id: ID!, input: UpdateRatingInput!): Rating!
    deleteRating(id: ID!): MessageResponse!
    markRatingHelpful(id: ID!): Rating!
    reportRating(id: ID!, reason: String!): MessageResponse!
    respondToRating(ratingId: ID!, response: String!): Rating!
    
    # Complaints
    submitComplaint(input: ComplaintInput!): Complaint!
    
    # Categories (Admin only)
    createCategory(
      name: String!
      slug: String!
      description: String
      icon: String
      color: String
      parentId: ID
      order: Int
    ): Category!
    updateCategory(
      id: ID!
      name: String
      slug: String
      description: String
      icon: String
      color: String
      parentId: ID
      order: Int
      isActive: Boolean
    ): Category!
    deleteCategory(id: ID!): MessageResponse!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    solutionCreated(categoryId: ID): Solution!
    solutionUpdated(id: ID!): Solution!
    newRating(solutionId: ID!): Rating!
    topSolutionsUpdated(categoryId: ID): [TopSolution!]!
  }
`;

export default solutionTypeDef;