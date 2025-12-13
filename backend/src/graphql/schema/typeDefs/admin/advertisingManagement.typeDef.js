// apps/backend/src/graphql/schema/typeDefs/admin/advertisingManagement.typeDef.js

import { gql } from 'apollo-server-express';

const advertisingManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================

  enum AdType {
    BANNER
    SIDEBAR
    INLINE
    POPUP
    NATIVE
    SPONSORED_SOLUTION
    SPONSORED_JOB
    FEATURED_LISTING
  }

  enum AdPlacement {
    HOME_HERO
    HOME_SIDEBAR
    SOLUTIONS_TOP
    SOLUTIONS_SIDEBAR
    SOLUTIONS_INLINE
    JOBS_TOP
    JOBS_SIDEBAR
    MARKETPLACE_TOP
    MARKETPLACE_SIDEBAR
    PROFILE_SIDEBAR
    CHAT_BANNER
    SEARCH_RESULTS
  }

  enum AdStatus {
    DRAFT
    PENDING_REVIEW
    APPROVED
    REJECTED
    ACTIVE
    PAUSED
    COMPLETED
    EXPIRED
  }

  enum AdBillingType {
    CPM
    CPC
    CPA
    FLAT_RATE
    DAILY
    WEEKLY
    MONTHLY
  }

  enum CampaignObjective {
    BRAND_AWARENESS
    TRAFFIC
    ENGAGEMENT
    CONVERSIONS
    LEAD_GENERATION
    SOLUTION_PROMOTION
    JOB_APPLICATIONS
  }

  enum TargetingType {
    ALL_USERS
    SUBSCRIPTION_TIER
    TECH_STACK
    LOCATION
    EMPLOYMENT_STATUS
    VERIFIED_ONLY
    CUSTOM_AUDIENCE
  }

  enum AdSortField {
    CREATED_AT
    START_DATE
    END_DATE
    IMPRESSIONS
    CLICKS
    BUDGET
    STATUS
  }

  # ============================================
  # TYPES
  # ============================================

  type Advertisement {
    id: ID!
    name: String!
    type: AdType!
    status: AdStatus!
    
    # Creative
    creative: AdCreative!
    
    # Placement
    placements: [AdPlacement!]!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    
    # Budget & Billing
    billing: AdBilling!
    
    # Targeting
    targeting: AdTargeting!
    
    # Performance
    stats: AdStats!
    
    # Advertiser
    advertiser: Advertiser!
    
    # Review
    reviewStatus: AdReviewInfo
    
    # Meta
    createdBy: Admin
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdCreative {
    title: String!
    description: String
    imageUrl: String
    videoUrl: String
    destinationUrl: String!
    callToAction: String!
    
    # Multiple sizes
    desktopImage: String
    mobileImage: String
    
    # For native ads
    sponsorName: String
    sponsorLogo: String
  }

  type AdBilling {
    type: AdBillingType!
    rate: Int!
    budget: Int!
    spentAmount: Int!
    remainingBudget: Int!
    dailyBudget: Int
    currency: String!
  }

  type AdTargeting {
    type: TargetingType!
    subscriptionTiers: [SubscriptionTier!]
    techStacks: [String!]
    countries: [String!]
    languages: [String!]
    employmentStatus: [String!]
    verifiedOnly: Boolean
    customAudienceId: ID
    excludeAudience: [ID!]
    
    # Device Targeting
    devices: [String!]
    platforms: [String!]
    
    # Time Targeting
    daysOfWeek: [Int!]
    hoursOfDay: [Int!]
    timezone: String
  }

  type AdStats {
    impressions: Int!
    clicks: Int!
    conversions: Int!
    ctr: Float!
    conversionRate: Float!
    spend: Int!
    cpc: Float!
    cpm: Float!
    cpa: Float!
    reach: Int!
    frequency: Float!
  }

  type AdReviewInfo {
    reviewedBy: Admin
    reviewedAt: DateTime
    rejectionReason: String
    rejectionNote: String
  }

  type Advertiser {
    id: ID!
    user: User
    companyName: String!
    contactEmail: String!
    contactPhone: String
    website: String
    
    # Billing
    billingAddress: String
    taxId: String
    
    # Account
    balance: Int!
    totalSpend: Int!
    status: String!
    
    # Campaigns
    campaigns: [AdCampaign!]!
    activeAds: Int!
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdCampaign {
    id: ID!
    name: String!
    advertiser: Advertiser!
    objective: CampaignObjective!
    status: AdStatus!
    
    # Ads
    ads: [Advertisement!]!
    
    # Budget
    totalBudget: Int!
    dailyBudget: Int
    spentAmount: Int!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    
    # Performance
    stats: CampaignPerformance!
    
    createdBy: Admin
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CampaignPerformance {
    impressions: Int!
    clicks: Int!
    conversions: Int!
    spend: Int!
    ctr: Float!
    conversionRate: Float!
    roas: Float!
    
    # Daily breakdown
    dailyStats: [DailyAdStats!]!
    
    # By placement
    placementStats: [PlacementStats!]!
  }

  type DailyAdStats {
    date: DateTime!
    impressions: Int!
    clicks: Int!
    conversions: Int!
    spend: Int!
    ctr: Float!
  }

  type PlacementStats {
    placement: AdPlacement!
    impressions: Int!
    clicks: Int!
    ctr: Float!
    spend: Int!
  }

  type AdAnalytics {
    # Overview
    totalImpressions: Int!
    totalClicks: Int!
    totalConversions: Int!
    totalRevenue: Int!
    averageCtr: Float!
    
    # Top Performers
    topCampaigns: [AdCampaign!]!
    topAds: [Advertisement!]!
    topPlacements: [PlacementStats!]!
    
    # Trends
    impressionTrend: [DailyAdStats!]!
    revenueTrend: [RevenueDataPoint!]!
    
    # By Type
    byAdType: [AdTypeStats!]!
    
    # Advertiser Stats
    activeAdvertisers: Int!
    newAdvertisers: Int!
  }

  type AdTypeStats {
    type: AdType!
    count: Int!
    impressions: Int!
    clicks: Int!
    revenue: Int!
    ctr: Float!
  }

  type RevenueDataPoint {
    date: DateTime!
    revenue: Int!
    adCount: Int!
  }

  type AdQueue {
    pendingReview: [Advertisement!]!
    totalPending: Int!
    averageReviewTime: Float
  }

  type CustomAudience {
    id: ID!
    name: String!
    description: String
    size: Int!
    criteria: JSON!
    createdBy: Admin!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdPricing {
    placement: AdPlacement!
    adType: AdType!
    cpmRate: Int!
    cpcRate: Int!
    dailyRate: Int!
    weeklyRate: Int!
    monthlyRate: Int!
    minimumBudget: Int!
    currency: String!
  }

  # ============================================
  # INPUTS
  # ============================================

  input AdFilterInput {
    status: [AdStatus!]
    type: [AdType!]
    placement: [AdPlacement!]
    advertiserId: ID
    campaignId: ID
    dateFrom: DateTime
    dateTo: DateTime
    searchTerm: String
  }

  input AdListInput {
    filter: AdFilterInput
    sortBy: AdSortField
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input CreateAdInput {
    name: String!
    type: AdType!
    campaignId: ID
    
    # Creative
    creative: AdCreativeInput!
    
    # Placement
    placements: [AdPlacement!]!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    
    # Budget
    billing: AdBillingInput!
    
    # Targeting
    targeting: AdTargetingInput!
  }

  input AdCreativeInput {
    title: String!
    description: String
    imageUrl: String
    videoUrl: String
    destinationUrl: String!
    callToAction: String!
    desktopImage: String
    mobileImage: String
    sponsorName: String
    sponsorLogo: String
  }

  input AdBillingInput {
    type: AdBillingType!
    rate: Int!
    budget: Int!
    dailyBudget: Int
  }

  input AdTargetingInput {
    type: TargetingType!
    subscriptionTiers: [SubscriptionTier!]
    techStacks: [String!]
    countries: [String!]
    languages: [String!]
    employmentStatus: [String!]
    verifiedOnly: Boolean
    customAudienceId: ID
    excludeAudience: [ID!]
    devices: [String!]
    platforms: [String!]
    daysOfWeek: [Int!]
    hoursOfDay: [Int!]
    timezone: String
  }

  input UpdateAdInput {
    adId: ID!
    name: String
    creative: AdCreativeInput
    placements: [AdPlacement!]
    startDate: DateTime
    endDate: DateTime
    billing: AdBillingInput
    targeting: AdTargetingInput
  }

  input CreateCampaignInput {
    name: String!
    advertiserId: ID!
    objective: CampaignObjective!
    totalBudget: Int!
    dailyBudget: Int
    startDate: DateTime!
    endDate: DateTime!
  }

  input UpdateCampaignInput {
    campaignId: ID!
    name: String
    totalBudget: Int
    dailyBudget: Int
    endDate: DateTime
  }

  input CreateAdvertiserInput {
    userId: ID
    companyName: String!
    contactEmail: String!
    contactPhone: String
    website: String
    billingAddress: String
    taxId: String
  }

  input UpdateAdvertiserInput {
    advertiserId: ID!
    companyName: String
    contactEmail: String
    contactPhone: String
    website: String
    billingAddress: String
    taxId: String
  }

  input ApproveAdInput {
    adId: ID!
    note: String
  }

  input RejectAdInput {
    adId: ID!
    reason: String!
    note: String
  }

  input CreateCustomAudienceInput {
    name: String!
    description: String
    criteria: JSON!
  }

  input UpdateAdPricingInput {
    placement: AdPlacement!
    adType: AdType!
    cpmRate: Int
    cpcRate: Int
    dailyRate: Int
    weeklyRate: Int
    monthlyRate: Int
    minimumBudget: Int
  }

  input AdAnalyticsInput {
    dateFrom: DateTime!
    dateTo: DateTime!
    advertiserId: ID
    campaignId: ID
    groupBy: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Ads
    advertisements(input: AdListInput!): PaginatedAds! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    advertisement(id: ID!): Advertisement @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    adQueue: AdQueue! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Campaigns
    adCampaigns(advertiserId: ID, status: AdStatus): [AdCampaign!]! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    adCampaign(id: ID!): AdCampaign @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Advertisers
    advertisers(status: String): [Advertiser!]! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    advertiser(id: ID!): Advertiser @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Analytics
    adAnalytics(input: AdAnalyticsInput!): AdAnalytics! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    adPerformance(adId: ID!, dateFrom: DateTime, dateTo: DateTime): AdStats! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    campaignPerformance(campaignId: ID!, dateFrom: DateTime, dateTo: DateTime): CampaignPerformance! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Audiences
    customAudiences: [CustomAudience!]! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    customAudience(id: ID!): CustomAudience @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    estimateAudienceSize(targeting: AdTargetingInput!): Int! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Pricing
    adPricing: [AdPricing!]! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    estimateAdCost(input: CreateAdInput!): Int! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
  }

  type PaginatedAds {
    ads: [Advertisement!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Ads
    createAd(input: CreateAdInput!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    updateAd(input: UpdateAdInput!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    deleteAd(adId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    
    # Ad Status
    approveAd(input: ApproveAdInput!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    rejectAd(input: RejectAdInput!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    pauseAd(adId: ID!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    resumeAd(adId: ID!): Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Campaigns
    createAdCampaign(input: CreateCampaignInput!): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    updateAdCampaign(input: UpdateCampaignInput!): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    pauseCampaign(campaignId: ID!): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    resumeCampaign(campaignId: ID!): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    cancelCampaign(campaignId: ID!): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Advertisers
    createAdvertiser(input: CreateAdvertiserInput!): Advertiser! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    updateAdvertiser(input: UpdateAdvertiserInput!): Advertiser! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    suspendAdvertiser(advertiserId: ID!, reason: String!): Advertiser! @auth(requires: [SUPER_ADMIN])
    reactivateAdvertiser(advertiserId: ID!): Advertiser! @auth(requires: [SUPER_ADMIN])
    addAdvertiserCredit(advertiserId: ID!, amount: Int!, note: String!): Advertiser! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    
    # Audiences
    createCustomAudience(input: CreateCustomAudienceInput!): CustomAudience! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    updateCustomAudience(audienceId: ID!, input: CreateCustomAudienceInput!): CustomAudience! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    deleteCustomAudience(audienceId: ID!): Boolean! @auth(requires: [SUPER_ADMIN])
    
    # Pricing
    updateAdPricing(input: UpdateAdPricingInput!): AdPricing! @auth(requires: [SUPER_ADMIN])
    
    # Bulk Actions
    bulkApproveAds(adIds: [ID!]!): Int! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    bulkPauseAds(adIds: [ID!]!): Int! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    newAdSubmission: Advertisement! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    adPerformanceUpdate(adId: ID!): AdStats! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
    campaignBudgetAlert(campaignId: ID): AdCampaign! @auth(requires: [ADVERTISING_ADMIN, SUPER_ADMIN])
  }
`;

export default advertisingManagementTypeDef;