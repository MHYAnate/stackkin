// apps/backend/src/graphql/schema/typeDefs/advertisement.typeDef.js
import { gql } from 'apollo-server-express';

export const advertisementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum AdType {
    BANNER
    INTERSTITIAL
    NATIVE
    VIDEO
    CAROUSEL
    POPUP
    SIDEBAR
    IN_FEED
  }

  enum AdFormat {
    IMAGE
    VIDEO
    HTML
    TEXT
    RICH_MEDIA
  }

  enum AdStatus {
    DRAFT
    PENDING_APPROVAL
    ACTIVE
    PAUSED
    COMPLETED
    REJECTED
    EXPIRED
    ARCHIVED
  }

  enum CampaignStatus {
    DRAFT
    ACTIVE
    PAUSED
    COMPLETED
    CANCELLED
    ARCHIVED
  }

  enum BiddingType {
    CPC
    CPM
    CPA
    CPE
    FIXED
  }

  enum TargetingType {
    DEMOGRAPHIC
    GEOGRAPHIC
    BEHAVIORAL
    CONTEXTUAL
    RETARGETING
    LOOKALIKE
  }

  enum AdPosition {
    TOP
    MIDDLE
    BOTTOM
    SIDEBAR_LEFT
    SIDEBAR_RIGHT
    IN_CONTENT
    POPUP
    NOTIFICATION
  }

  enum DeviceType {
    DESKTOP
    MOBILE
    TABLET
    ALL
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateAdvertisementInput {
    campaignId: ID!
    name: String!
    type: AdType!
    format: AdFormat!
    
    # Creative
    title: String!
    description: String!
    imageUrl: String
    videoUrl: String
    htmlContent: String
    callToAction: String!
    destinationUrl: String!
    
    # Targeting
    targeting: TargetingInput!
    
    # Scheduling
    startDate: DateTime!
    endDate: DateTime!
    schedule: ScheduleInput
    
    # Bidding
    biddingType: BiddingType!
    bidAmount: Int!
    dailyBudget: Int
    totalBudget: Int
    
    # Metadata
    tags: [String!]
    metadata: JSON
  }

  input CreateCampaignInput {
    name: String!
    description: String!
    advertiserId: ID!
    
    # Budget
    budgetType: BudgetType!
    totalBudget: Int!
    dailyBudget: Int
    
    # Goals
    goalType: GoalType!
    goalValue: Int!
    
    # Targeting
    targeting: CampaignTargetingInput!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    
    # Metadata
    tags: [String!]
    notes: String
  }

  input TargetingInput {
    demographics: DemographicTargeting
    geography: GeographicTargeting
    behavior: BehavioralTargeting
    contextual: ContextualTargeting
    device: DeviceTargeting
    schedule: ScheduleTargeting
  }

  input CampaignTargetingInput {
    countries: [String!]
    languages: [String!]
    subscriptionTiers: [SubscriptionTier!]
    userRoles: [UserRole!]
    categories: [String!]
    techStack: [String!]
    employmentStatus: [EmploymentStatus!]
    minRating: Float
    isVerified: Boolean
    customFilters: JSON
  }

  input DemographicTargeting {
    ageRanges: [AgeRange!]
    gender: Gender
    languages: [String!]
    educationLevels: [EducationLevel!]
    employmentStatus: [EmploymentStatus!]
    incomeRanges: [IncomeRange!]
  }

  input GeographicTargeting {
    countries: [String!]
    regions: [String!]
    cities: [String!]
    postalCodes: [String!]
    radius: RadiusTargeting
    customAreas: JSON
  }

  input BehavioralTargeting {
    interests: [String!]
    behaviors: [BehaviorType!]
    engagementLevel: EngagementLevel
    purchaseIntent: PurchaseIntent
    customSegments: [String!]
  }

  input ContextualTargeting {
    categories: [String!]
    keywords: [String!]
    contentTypes: [ContentType!]
    pageTypes: [PageType!]
    placementPositions: [AdPosition!]
  }

  input DeviceTargeting {
    deviceTypes: [DeviceType!]
    operatingSystems: [String!]
    browsers: [String!]
    screenSizes: [ScreenSize!]
    connectionTypes: [ConnectionType!]
  }

  input ScheduleTargeting {
    daysOfWeek: [DayOfWeek!]
    hoursOfDay: [Int!]
    timezone: String!
    blackoutDates: [DateTime!]
  }

  input ScheduleInput {
    startTime: String!
    endTime: String!
    days: [DayOfWeek!]!
    timezone: String!
  }

  input UpdateAdStatusInput {
    adId: ID!
    status: AdStatus!
    reason: String
  }

  input UpdateCampaignStatusInput {
    campaignId: ID!
    status: CampaignStatus!
    reason: String
  }

  input AdFilterInput {
    status: AdStatus
    type: AdType
    format: AdFormat
    campaignId: ID
    advertiserId: ID
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  input CampaignFilterInput {
    status: CampaignStatus
    advertiserId: ID
    search: String
    startDate: DateTime
    endDate: DateTime
  }

  enum AgeRange {
    UNDER_18
    AGE_18_24
    AGE_25_34
    AGE_35_44
    AGE_45_54
    AGE_55_PLUS
  }

  enum EducationLevel {
    HIGH_SCHOOL
    SOME_COLLEGE
    BACHELORS
    MASTERS
    DOCTORATE
  }

  enum IncomeRange {
    UNDER_20K
    AGE_20K_40K
    AGE_40K_60K
    AGE_60K_80K
    AGE_80K_100K
    OVER_100K
  }

  enum BehaviorType {
    SOLUTION_CREATOR
    JOB_POSTER
    MARKETPLACE_BUYER
    MARKETPLACE_SELLER
    FREQUENT_CHATTER
    PREMIUM_USER
    VERIFIED_USER
    NEW_USER
    RETURNING_USER
    POWER_USER
  }

  enum EngagementLevel {
    LOW
    MEDIUM
    HIGH
    VERY_HIGH
  }

  enum PurchaseIntent {
    RESEARCHING
    COMPARING
    READY_TO_BUY
    JUST_BROWSING
  }

  enum ContentType {
    SOLUTION
    JOB
    MARKETPLACE
    PROFILE
    CHAT
    SQUAD
    KNOWLEDGE_HUB
    LEADERBOARD
  }

  enum PageType {
    HOME
    CATEGORY
    DETAIL
    LISTING
    PROFILE
    CHAT
    ADMIN
  }

  enum ScreenSize {
    MOBILE_SMALL
    MOBILE_LARGE
    TABLET
    DESKTOP_SMALL
    DESKTOP_LARGE
  }

  enum ConnectionType {
    WIFI
    MOBILE_4G
    MOBILE_3G
    MOBILE_2G
    ETHERNET
  }

  enum DayOfWeek {
    MONDAY
    TUESDAY
    WEDNESDAY
    THURSDAY
    FRIDAY
    SATURDAY
    SUNDAY
  }

  enum BudgetType {
    DAILY
    TOTAL
    LIFETIME
  }

  enum GoalType {
    IMPRESSIONS
    CLICKS
    CONVERSIONS
    LEADS
    SALES
    ENGAGEMENT
    AWARENESS
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Advertisement {
    id: ID!
    campaign: Campaign!
    name: String!
    type: AdType!
    format: AdFormat!
    status: AdStatus!
    
    # Creative
    title: String!
    description: String!
    imageUrl: String
    videoUrl: String
    thumbnailUrl: String
    htmlContent: String
    callToAction: String!
    destinationUrl: String!
    
    # Targeting
    targeting: Targeting!
    approvedTargeting: Targeting
    
    # Scheduling
    startDate: DateTime!
    endDate: DateTime!
    schedule: Schedule
    approvedSchedule: Schedule
    
    # Bidding & Budget
    biddingType: BiddingType!
    bidAmount: Int!
    dailyBudget: Int
    totalBudget: Int
    spentAmount: Int!
    
    # Performance
    performance: AdPerformance!
    analytics: AdAnalytics!
    
    # Approval
    approved: Boolean!
    approvedBy: User
    approvedAt: DateTime
    rejectionReason: String
    
    # Metadata
    tags: [String!]
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    activatedAt: DateTime
    pausedAt: DateTime
    completedAt: DateTime
  }

  type Targeting {
    demographics: DemographicTargetingData
    geography: GeographicTargetingData
    behavior: BehavioralTargetingData
    contextual: ContextualTargetingData
    device: DeviceTargetingData
    schedule: ScheduleTargetingData
  }

  type DemographicTargetingData {
    ageRanges: [AgeRange!]
    gender: Gender
    languages: [String!]
    educationLevels: [EducationLevel!]
    employmentStatus: [EmploymentStatus!]
    incomeRanges: [IncomeRange!]
  }

  type GeographicTargetingData {
    countries: [String!]
    regions: [String!]
    cities: [String!]
    postalCodes: [String!]
    radius: RadiusTargetingData
    customAreas: JSON
  }

  type RadiusTargetingData {
    latitude: Float!
    longitude: Float!
    radiusKm: Int!
  }

  type BehavioralTargetingData {
    interests: [String!]
    behaviors: [BehaviorType!]
    engagementLevel: EngagementLevel
    purchaseIntent: PurchaseIntent
    customSegments: [String!]
  }

  type ContextualTargetingData {
    categories: [String!]
    keywords: [String!]
    contentTypes: [ContentType!]
    pageTypes: [PageType!]
    placementPositions: [AdPosition!]
  }

  type DeviceTargetingData {
    deviceTypes: [DeviceType!]
    operatingSystems: [String!]
    browsers: [String!]
    screenSizes: [ScreenSize!]
    connectionTypes: [ConnectionType!]
  }

  type ScheduleTargetingData {
    daysOfWeek: [DayOfWeek!]
    hoursOfDay: [Int!]
    timezone: String!
    blackoutDates: [DateTime!]
  }

  type Schedule {
    startTime: String!
    endTime: String!
    days: [DayOfWeek!]!
    timezone: String!
  }

  type AdPerformance {
    impressions: Int!
    clicks: Int!
    conversions: Int!
    ctr: Float!
    conversionRate: Float!
    cpc: Float!
    cpm: Float!
    roas: Float!
    
    # Engagement
    views: Int!
    engagements: Int!
    shares: Int!
    comments: Int!
    
    # Quality
    qualityScore: Float!
    relevanceScore: Float!
    engagementRate: Float!
    
    # Time-based
    hourly: [HourlyMetrics!]!
    daily: [DailyMetrics!]!
    weekly: [WeeklyMetrics!]!
  }

  type AdAnalytics {
    demographics: DemographicAnalytics
    geography: GeographicAnalytics
    device: DeviceAnalytics
    behavioral: BehavioralAnalytics
    contextual: ContextualAnalytics
  }

  type DemographicAnalytics {
    byAge: [AgeGroupMetrics!]!
    byGender: [GenderMetrics!]!
    byEducation: [EducationMetrics!]!
    byIncome: [IncomeMetrics!]!
  }

  type GeographicAnalytics {
    byCountry: [CountryMetrics!]!
    byRegion: [RegionMetrics!]!
    byCity: [CityMetrics!]!
  }

  type DeviceAnalytics {
    byDeviceType: [DeviceMetrics!]!
    byOs: [OsMetrics!]!
    byBrowser: [BrowserMetrics!]!
    byScreenSize: [ScreenSizeMetrics!]!
  }

  type BehavioralAnalytics {
    byInterest: [InterestMetrics!]!
    byBehavior: [BehaviorMetrics!]!
    byEngagement: [EngagementMetrics!]!
  }

  type ContextualAnalytics {
    byCategory: [CategoryMetrics!]!
    byPageType: [PageTypeMetrics!]!
    byPosition: [PositionMetrics!]!
  }

  type Campaign {
    id: ID!
    name: String!
    description: String!
    advertiser: User!
    status: CampaignStatus!
    
    # Budget
    budgetType: BudgetType!
    totalBudget: Int!
    dailyBudget: Int
    spentAmount: Int!
    remainingBudget: Int!
    
    # Goals
    goalType: GoalType!
    goalValue: Int!
    currentGoalProgress: Int!
    goalCompletion: Float!
    
    # Targeting
    targeting: CampaignTargeting!
    
    # Schedule
    startDate: DateTime!
    endDate: DateTime!
    durationDays: Int!
    
    # Ads
    advertisements: [Advertisement!]!
    activeAds: [Advertisement!]!
    
    # Performance
    performance: CampaignPerformance!
    analytics: CampaignAnalytics!
    
    # Metadata
    tags: [String!]
    notes: String
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    activatedAt: DateTime
    completedAt: DateTime
  }

  type CampaignTargeting {
    countries: [String!]
    languages: [String!]
    subscriptionTiers: [SubscriptionTier!]
    userRoles: [UserRole!]
    categories: [String!]
    techStack: [String!]
    employmentStatus: [EmploymentStatus!]
    minRating: Float
    isVerified: Boolean
    customFilters: JSON
  }

  type CampaignPerformance {
    totalImpressions: Int!
    totalClicks: Int!
    totalConversions: Int!
    totalSpent: Int!
    
    averageCtr: Float!
    averageCpc: Float!
    averageCpm: Float!
    roas: Float!
    
    # Goal Tracking
    goalProgress: Int!
    goalCompletion: Float!
    
    # Efficiency
    costPerGoal: Float!
    efficiencyScore: Float!
    
    # Timeline
    timeline: [CampaignTimelinePoint!]!
  }

  type CampaignAnalytics {
    topPerformingAds: [Advertisement!]!
    worstPerformingAds: [Advertisement!]!
    
    demographicBreakdown: DemographicBreakdown
    geographicBreakdown: GeographicBreakdown
    temporalBreakdown: TemporalBreakdown
    
    recommendations: [Recommendation!]!
    insights: [Insight!]!
  }

  type Advertiser {
    id: ID!
    user: User!
    companyName: String
    companyLogo: String
    website: String
    contactEmail: String
    contactPhone: String
    
    # Stats
    totalCampaigns: Int!
    activeCampaigns: Int!
    totalSpent: Int!
    averageRoas: Float!
    
    # Settings
    billingSettings: BillingSettings
    notificationSettings: NotificationSettings
    
    # Verification
    verified: Boolean!
    verificationStatus: VerificationStatus!
    
    # Metadata
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BillingSettings {
    paymentMethod: PaymentMethod
    billingAddress: BillingAddress
    taxId: String
    invoiceFrequency: InvoiceFrequency
    autoRecharge: Boolean
    rechargeThreshold: Int
  }

  type BillingAddress {
    street: String!
    city: String!
    state: String!
    country: String!
    postalCode: String!
  }

  enum InvoiceFrequency {
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
    MANUAL
  }

  type NotificationSettings {
    campaignNotifications: Boolean
    budgetNotifications: Boolean
    performanceNotifications: Boolean
    billingNotifications: Boolean
    emailFrequency: EmailFrequency
  }

  enum EmailFrequency {
    DAILY
    WEEKLY
    MONTHLY
    REAL_TIME
    NONE
  }

  type AdSlot {
    id: ID!
    name: String!
    description: String!
    type: AdType!
    format: AdFormat!
    position: AdPosition!
    
    # Dimensions
    width: Int!
    height: Int!
    aspectRatio: String!
    
    # Pricing
    basePrice: Int!
    pricingModel: PricingModel!
    availability: Availability!
    
    # Targeting
    allowedTargeting: [TargetingType!]!
    restrictions: [Restriction!]!
    
    # Performance
    fillRate: Float!
    ctrBenchmark: Float!
    
    # Status
    active: Boolean!
    
    # Metadata
    metadata: JSON
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum PricingModel {
    FIXED
    AUCTION
    HYBRID
  }

  type Availability {
    totalImpressions: Int
    availableImpressions: Int
    bookedImpressions: Int
    startDate: DateTime
    endDate: DateTime
  }

  type Restriction {
    type: RestrictionType!
    value: String!
    message: String!
  }

  enum RestrictionType {
    CATEGORY
    CONTENT
    ADVERTISER
    BUDGET
    SCHEDULE
    GEOGRAPHY
    DEVICE
    CUSTOM
  }

  type AdMetrics {
    # Basic Metrics
    impressions: Int!
    clicks: Int!
    conversions: Int!
    
    # Derived Metrics
    ctr: Float!
    conversionRate: Float!
    cpc: Float!
    cpm: Float!
    
    # Engagement
    viewThroughRate: Float!
    engagementRate: Float!
    bounceRate: Float!
    
    # Quality
    qualityScore: Float!
    relevanceScore: Float!
  }

  type HourlyMetrics {
    hour: Int!
    impressions: Int!
    clicks: Int!
    conversions: Int!
    ctr: Float!
  }

  type DailyMetrics {
    date: DateTime!
    impressions: Int!
    clicks: Int!
    conversions: Int!
    spent: Int!
    ctr: Float!
  }

  type WeeklyMetrics {
    week: Int!
    year: Int!
    impressions: Int!
    clicks: Int!
    conversions: Int!
    spent: Int!
  }

  type AgeGroupMetrics {
    ageRange: AgeRange!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type GenderMetrics {
    gender: Gender!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type EducationMetrics {
    educationLevel: EducationLevel!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type IncomeMetrics {
    incomeRange: IncomeRange!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type CountryMetrics {
    country: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type RegionMetrics {
    region: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type CityMetrics {
    city: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type DeviceMetrics {
    deviceType: DeviceType!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type OsMetrics {
    os: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type BrowserMetrics {
    browser: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type ScreenSizeMetrics {
    screenSize: ScreenSize!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type InterestMetrics {
    interest: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type BehaviorMetrics {
    behavior: BehaviorType!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type EngagementMetrics {
    engagementLevel: EngagementLevel!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type CategoryMetrics {
    category: String!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type PageTypeMetrics {
    pageType: PageType!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type PositionMetrics {
    position: AdPosition!
    impressions: Int!
    clicks: Int!
    ctr: Float!
  }

  type CampaignTimelinePoint {
    date: DateTime!
    impressions: Int!
    clicks: Int!
    conversions: Int!
    spent: Int!
  }

  type DemographicBreakdown {
    ageDistribution: JSON
    genderDistribution: JSON
    locationDistribution: JSON
  }

  type GeographicBreakdown {
    countryDistribution: JSON
    cityDistribution: JSON
  }

  type TemporalBreakdown {
    hourlyDistribution: JSON
    dailyDistribution: JSON
    weeklyDistribution: JSON
  }

  type Recommendation {
    type: RecommendationType!
    priority: PriorityLevel!
    title: String!
    description: String!
    action: String!
    impact: Float!
  }

  enum RecommendationType {
    BUDGET
    BIDDING
    TARGETING
    CREATIVE
    SCHEDULING
    EXPANSION
    OPTIMIZATION
  }

  type Insight {
    type: InsightType!
    title: String!
    description: String!
    data: JSON!
    timestamp: DateTime!
  }

  enum InsightType {
    PERFORMANCE
    AUDIENCE
    COMPETITIVE
    SEASONAL
    TECHNICAL
  }

  type AdStats {
    totalAds: Int!
    activeAds: Int!
    pendingAds: Int!
    totalCampaigns: Int!
    activeCampaigns: Int!
    totalSpent: Int!
    totalRevenue: Int!
    
    # Platform Performance
    fillRate: Float!
    averageCtr: Float!
    averageCpm: Float!
    
    # By Type
    byAdType: [TypeStats!]!
    byCampaignStatus: [StatusStats!]!
    
    # Revenue
    dailyRevenue: Int!
    monthlyRevenue: Int!
    yearlyRevenue: Int!
  }

  type TypeStats {
    type: AdType!
    count: Int!
    impressions: Int!
    revenue: Int!
  }

  type StatusStats {
    status: CampaignStatus!
    count: Int!
    spent: Int!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Current User (Advertiser)
    myAdvertiserProfile: Advertiser
    myCampaigns(
      filter: CampaignFilterInput
      pagination: PaginationInput
    ): CampaignConnection!
    
    myAdvertisements(
      filter: AdFilterInput
      pagination: PaginationInput
    ): AdvertisementConnection!
    
    myCampaignPerformance(campaignId: ID!): CampaignPerformance!
    myAdPerformance(adId: ID!): AdPerformance!
    
    # Public
    availableAdSlots(
      type: AdType
      position: AdPosition
      active: Boolean
    ): [AdSlot!]!
    
    adSlotDetails(slotId: ID!): AdSlot!
    
    # Admin
    allCampaigns(
      filter: CampaignFilterInput
      pagination: PaginationInput
    ): CampaignConnection!
    
    allAdvertisements(
      filter: AdFilterInput
      pagination: PaginationInput
    ): AdvertisementConnection!
    
    adStats(
      startDate: DateTime
      endDate: DateTime
      groupBy: StatsGroupBy
    ): AdStats!
    
    pendingApprovals(
      type: ApprovalType
      pagination: PaginationInput
    ): ApprovalConnection!
    
    # Analytics
    campaignAnalytics(campaignId: ID!): CampaignAnalytics!
    adAnalytics(adId: ID!): AdAnalytics!
  }

  type CampaignConnection {
    edges: [CampaignEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CampaignEdge {
    node: Campaign!
    cursor: String!
  }

  type AdvertisementConnection {
    edges: [AdvertisementEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AdvertisementEdge {
    node: Advertisement!
    cursor: String!
  }

  type ApprovalConnection {
    edges: [ApprovalEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ApprovalEdge {
    node: ApprovalItem!
    cursor: String!
  }

  type ApprovalItem {
    id: ID!
    type: ApprovalType!
    item: JSON!
    submittedBy: User!
    submittedAt: DateTime!
    status: ApprovalStatus!
    notes: String
  }

  enum ApprovalType {
    AD_CREATIVE
    AD_TARGETING
    AD_SCHEDULE
    CAMPAIGN_BUDGET
    ADVERTISER_VERIFICATION
  }

  enum ApprovalStatus {
    PENDING
    APPROVED
    REJECTED
    REQUEST_CHANGES
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Advertiser
    registerAsAdvertiser(
      companyName: String
      companyLogo: String
      website: String
      contactEmail: String
      contactPhone: String
    ): Advertiser!
    
    updateAdvertiserProfile(input: UpdateAdvertiserInput!): Advertiser!
    
    # Campaigns
    createCampaign(input: CreateCampaignInput!): Campaign!
    updateCampaign(campaignId: ID!, input: UpdateCampaignInput!): Campaign!
    updateCampaignStatus(input: UpdateCampaignStatusInput!): Campaign!
    deleteCampaign(campaignId: ID!): MessageResponse!
    duplicateCampaign(campaignId: ID!, newName: String!): Campaign!
    
    # Advertisements
    createAdvertisement(input: CreateAdvertisementInput!): Advertisement!
    updateAdvertisement(adId: ID!, input: UpdateAdvertisementInput!): Advertisement!
    updateAdStatus(input: UpdateAdStatusInput!): Advertisement!
    deleteAdvertisement(adId: ID!): MessageResponse!
    duplicateAdvertisement(adId: ID!, newName: String!): Advertisement!
    
    # Bidding & Budget
    updateBid(adId: ID!, bidAmount: Int!): Advertisement!
    updateBudget(campaignId: ID!, budgetType: BudgetType!, amount: Int!): Campaign!
    addBudget(campaignId: ID!, amount: Int!): Campaign!
    
    # Targeting
    updateTargeting(adId: ID!, targeting: TargetingInput!): Advertisement!
    updateSchedule(adId: ID!, schedule: ScheduleInput!): Advertisement!
    
    # Creative
    updateCreative(adId: ID!, creative: CreativeUpdateInput!): Advertisement!
    
    # Admin
    approveAd(adId: ID!, approved: Boolean!, reason: String): Advertisement!
    approveCampaign(campaignId: ID!, approved: Boolean!, reason: String): Campaign!
    
    verifyAdvertiser(advertiserId: ID!, verified: Boolean!, reason: String): Advertiser!
    
    createAdSlot(input: CreateAdSlotInput!): AdSlot!
    updateAdSlot(slotId: ID!, input: UpdateAdSlotInput!): AdSlot!
    deleteAdSlot(slotId: ID!): MessageResponse!
    
    # Testing
    previewAd(adId: ID!, deviceType: DeviceType!): String!
    testAdTargeting(adId: ID!, userId: ID!): Boolean!
  }

  input UpdateAdvertiserInput {
    companyName: String
    companyLogo: String
    website: String
    contactEmail: String
    contactPhone: String
    billingSettings: BillingSettingsInput
    notificationSettings: NotificationSettingsInput
  }

  input BillingSettingsInput {
    paymentMethodId: String
    billingAddress: BillingAddressInput
    taxId: String
    invoiceFrequency: InvoiceFrequency
    autoRecharge: Boolean
    rechargeThreshold: Int
  }

  input BillingAddressInput {
    street: String
    city: String
    state: String
    country: String
    postalCode: String
  }

  input NotificationSettingsInput {
    campaignNotifications: Boolean
    budgetNotifications: Boolean
    performanceNotifications: Boolean
    billingNotifications: Boolean
    emailFrequency: EmailFrequency
  }

  input UpdateCampaignInput {
    name: String
    description: String
    budgetType: BudgetType
    totalBudget: Int
    dailyBudget: Int
    goalType: GoalType
    goalValue: Int
    targeting: CampaignTargetingInput
    startDate: DateTime
    endDate: DateTime
    tags: [String!]
    notes: String
  }

  input UpdateAdvertisementInput {
    name: String
    title: String
    description: String
    imageUrl: String
    videoUrl: String
    htmlContent: String
    callToAction: String
    destinationUrl: String
    biddingType: BiddingType
    bidAmount: Int
    dailyBudget: Int
    totalBudget: Int
    tags: [String!]
    metadata: JSON
  }

  input CreativeUpdateInput {
    title: String
    description: String
    imageUrl: String
    videoUrl: String
    htmlContent: String
    callToAction: String
    destinationUrl: String
  }

  input CreateAdSlotInput {
    name: String!
    description: String!
    type: AdType!
    format: AdFormat!
    position: AdPosition!
    width: Int!
    height: Int!
    basePrice: Int!
    pricingModel: PricingModel!
    allowedTargeting: [TargetingType!]!
    restrictions: [RestrictionInput!]!
    metadata: JSON
  }

  input UpdateAdSlotInput {
    name: String
    description: String
    basePrice: Int
    pricingModel: PricingModel
    allowedTargeting: [TargetingType!]
    restrictions: [RestrictionInput!]
    active: Boolean
    metadata: JSON
  }

  input RestrictionInput {
    type: RestrictionType!
    value: String!
    message: String!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    campaignUpdated(campaignId: ID!): Campaign!
    adPerformanceUpdated(adId: ID!): AdPerformance!
    budgetAlert(campaignId: ID!): BudgetAlert!
    approvalStatusChanged: ApprovalItem!
  }

  type BudgetAlert {
    campaign: Campaign!
    alertType: BudgetAlertType!
    message: String!
    threshold: Int!
    currentSpent: Int!
    timestamp: DateTime!
  }

  enum BudgetAlertType {
    DAILY_LIMIT_REACHED
    DAILY_LIMIT_WARNING
    TOTAL_BUDGET_REACHED
    TOTAL_BUDGET_WARNING
    LOW_BALANCE
    BUDGET_EXCEEDED
  }
`;

export default advertisementTypeDef;