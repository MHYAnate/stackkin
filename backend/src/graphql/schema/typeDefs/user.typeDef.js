// apps/backend/src/graphql/schema/typeDefs/user.typeDef.js

import { gql } from 'apollo-server-express';

export const userTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================
  
  enum UserRole {
    USER
    ADMIN
    SUPER_ADMIN
    USER_MANAGEMENT_ADMIN
    SOLUTIONS_MANAGEMENT_ADMIN
    JOB_BOARD_ADMIN
    MARKETPLACE_ADMIN
    CHAT_ADMIN
    VERIFICATION_ADMIN
    SUBSCRIPTION_ADMIN
    EMAIL_ADMIN
    ADVERTISING_ADMIN
    ANALYTICS_ADMIN
    SECURITY_ADMIN
  }

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

  enum EmploymentStatus {
    AVAILABLE
    EMPLOYED
    FREELANCING
    NOT_LOOKING
    OPEN_TO_OPPORTUNITIES
  }

  enum Gender {
    MALE
    FEMALE
  }

  enum VerificationStatus {
    NOT_SUBMITTED
    PENDING
    APPROVED
    REJECTED
  }

  enum AccountStatus {
    ACTIVE
    SUSPENDED
    BANNED
    DEACTIVATED
  }

  enum TwoFactorMethod {
    APP
    SMS
    EMAIL
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    username: String!
    acceptedTerms: Boolean!
  }

  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean
  }

  input ProfileInfoInput {
    nationality: String!
    techStack: [String!]!
    employmentStatus: EmploymentStatus!
    bio: String
    yearsOfExperience: Int
    github: String
    linkedin: String
    twitter: String
    website: String
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    username: String
    bio: String
    avatar: String
    coverImage: String
    nationality: String
    location: String
    techStack: [String!]
    employmentStatus: EmploymentStatus
    yearsOfExperience: Int
    hourlyRate: Float
    github: String
    linkedin: String
    twitter: String
    website: String
    portfolio: String
    preferredLanguages: [String!]
    timezone: String
    availableForHire: Boolean
    showEmail: Boolean
    showPhone: Boolean
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
    confirmPassword: String!
  }

  input VerificationDocumentInput {
    documentType: DocumentType!
    documentNumber: String!
    documentImage: String!
    additionalImage: String
    expiryDate: String
  }

  input TwoFactorSetupInput {
    method: TwoFactorMethod!
    phoneNumber: String
  }

  input VerifyTwoFactorInput {
    code: String!
    backupCode: String
  }

  input SessionFilterInput {
    isActive: Boolean
    deviceType: String
  }

  input UserFilterInput {
    role: UserRole
    subscriptionTier: SubscriptionTier
    isVerified: Boolean
    employmentStatus: EmploymentStatus
    nationality: String
    techStack: [String!]
    search: String
    accountStatus: AccountStatus
    minYearsExperience: Int
    maxYearsExperience: Int
    availableForHire: Boolean
  }

  input PaginationInput {
    page: Int
    limit: Int
    sortBy: String
    sortOrder: SortOrder
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum DocumentType {
    NIN
    PASSPORT
    DRIVERS_LICENSE
    NATIONAL_ID
    VOTERS_CARD
  }

  # ==========================================
  # TYPES
  # ==========================================

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String!
    email: String!
    username: String!
    avatar: String
    coverImage: String
    bio: String
    nationality: String
    location: String
    
    # Professional Info
    techStack: [String!]!
    employmentStatus: EmploymentStatus!
    yearsOfExperience: Int
    hourlyRate: Float
    availableForHire: Boolean!
    
    # Social Links
    github: String
    linkedin: String
    twitter: String
    website: String
    portfolio: String
    
    # Preferences
    preferredLanguages: [String!]!
    timezone: String
    showEmail: Boolean!
    showPhone: Boolean!
    
    # Subscription & Verification
    role: UserRole!
    subscriptionTier: SubscriptionTier!
    subscription: Subscription
    isVerified: Boolean!
    verificationStatus: VerificationStatus!
    accountStatus: AccountStatus!
    
    # Two Factor Auth
    twoFactorEnabled: Boolean!
    twoFactorMethod: TwoFactorMethod
    
    # Stats & Metrics
    stats: UserStats!
    achievements: [Achievement!]!
    badges: [Badge!]!
    streak: StreakInfo!
    
    # Relations
    solutions: [Solution!]!
    solutionsCount: Int!
    jobs: [Job!]!
    jobsCount: Int!
    marketplaceListings: [MarketplaceListing!]!
    squads: [Squad!]!
    ratings: [Rating!]!
    averageRating: Float!
    
    # Profile Sharing
    shareableLink: String!
    qrCode: String!
    profileViews: Int!
    
    # Timestamps
    emailVerifiedAt: DateTime
    lastLoginAt: DateTime
    lastActiveAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserStats {
    totalSolutions: Int!
    totalJobs: Int!
    totalListings: Int!
    totalRatings: Int!
    averageRating: Float!
    totalViews: Int!
    totalClicks: Int!
    profileCompleteness: Int!
    reputationScore: Int!
    leaderboardRank: Int
  }

  type StreakInfo {
    currentStreak: Int!
    longestStreak: Int!
    lastActivityDate: DateTime
    streakProtectionUsed: Boolean!
    streakProtectionAvailableDate: DateTime
  }

  type Achievement {
    id: ID!
    name: String!
    description: String!
    icon: String!
    category: AchievementCategory!
    unlockedAt: DateTime!
    progress: Int
    maxProgress: Int
  }

  enum AchievementCategory {
    SOLUTIONS
    JOBS
    MARKETPLACE
    COMMUNITY
    VERIFICATION
    STREAK
    SPECIAL
  }

  type Badge {
    id: ID!
    name: String!
    description: String!
    icon: String!
    color: String!
    tier: BadgeTier!
    earnedAt: DateTime!
  }

  enum BadgeTier {
    BRONZE
    SILVER
    GOLD
    PLATINUM
    DIAMOND
  }

  type Session {
    id: ID!
    userId: ID!
    deviceInfo: DeviceInfo!
    ipAddress: String!
    location: String
    isActive: Boolean!
    lastAccessedAt: DateTime!
    createdAt: DateTime!
    expiresAt: DateTime!
  }

  type DeviceInfo {
    browser: String
    browserVersion: String
    os: String
    osVersion: String
    device: String
    deviceType: String
    isMobile: Boolean!
  }

  type VerificationDocument {
    id: ID!
    documentType: DocumentType!
    documentNumber: String!
    documentImage: String!
    additionalImage: String
    status: VerificationStatus!
    submittedAt: DateTime!
    reviewedAt: DateTime
    reviewedBy: User
    rejectionReason: String
    expiryDate: DateTime
  }

  type TwoFactorSetup {
    secret: String!
    qrCode: String!
    backupCodes: [String!]!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type TokenPayload {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  type MessageResponse {
    success: Boolean!
    message: String!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    currentPage: Int!
    totalPages: Int!
  }

  type PublicProfile {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String!
    username: String!
    avatar: String
    coverImage: String
    bio: String
    nationality: String
    location: String
    techStack: [String!]!
    employmentStatus: EmploymentStatus!
    yearsOfExperience: Int
    availableForHire: Boolean!
    isVerified: Boolean!
    subscriptionTier: SubscriptionTier!
    github: String
    linkedin: String
    twitter: String
    website: String
    portfolio: String
    stats: UserStats!
    achievements: [Achievement!]!
    badges: [Badge!]!
    solutions: [Solution!]!
    averageRating: Float!
    squads: [Squad!]!
  }

  type TalentPoolUser {
    id: ID!
    firstName: String!
    lastName: String!
    fullName: String!
    username: String!
    avatar: String
    bio: String
    nationality: String
    location: String
    techStack: [String!]!
    employmentStatus: EmploymentStatus!
    yearsOfExperience: Int
    hourlyRate: Float
    availableForHire: Boolean!
    isVerified: Boolean!
    subscriptionTier: SubscriptionTier!
    averageRating: Float!
    reputationScore: Int!
    solutionsCount: Int!
  }

  type TalentPoolConnection {
    edges: [TalentPoolEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TalentPoolEdge {
    node: TalentPoolUser!
    cursor: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Auth & Current User
    me: User!
    myProfile: User!
    mySessions: [Session!]!
    myAchievements: [Achievement!]!
    myBadges: [Badge!]!
    myStreak: StreakInfo!
    myVerificationStatus: VerificationDocument
    
    # Public Profiles
    userByUsername(username: String!): PublicProfile
    userById(id: ID!): PublicProfile
    shareableProfile(username: String!): PublicProfile
    
    # Talent Pool (subscription restricted)
    talentPool(
      filter: UserFilterInput
      pagination: PaginationInput
    ): TalentPoolConnection!
    
    # Search
    searchUsers(
      query: String!
      filter: UserFilterInput
      pagination: PaginationInput
    ): UserConnection!
    
    # Leaderboard
    leaderboard(
      period: LeaderboardPeriod!
      category: LeaderboardCategory
      limit: Int
    ): [LeaderboardEntry!]!
    
    # Two Factor
    getTwoFactorStatus: TwoFactorStatus!
    
    # Check availability
    checkEmailAvailability(email: String!): Boolean!
    checkUsernameAvailability(username: String!): Boolean!
  }

  enum LeaderboardPeriod {
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
    ALL_TIME
  }

  enum LeaderboardCategory {
    SOLUTIONS
    RATINGS
    REPUTATION
    STREAK
    OVERALL
  }

  type LeaderboardEntry {
    rank: Int!
    user: TalentPoolUser!
    score: Int!
    change: Int
  }

  type TwoFactorStatus {
    enabled: Boolean!
    method: TwoFactorMethod
    verifiedAt: DateTime
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Authentication
    register(input: RegisterInput!): MessageResponse!
    login(input: LoginInput!): AuthPayload!
    logout: MessageResponse!
    logoutAllDevices: MessageResponse!
    refreshToken(refreshToken: String!): TokenPayload!
    
    # Email Verification
    verifyEmail(token: String!): AuthPayload!
    resendVerificationEmail: MessageResponse!
    
    # Password Management
    changePassword(input: ChangePasswordInput!): MessageResponse!
    forgotPassword(input: ForgotPasswordInput!): MessageResponse!
    resetPassword(input: ResetPasswordInput!): MessageResponse!
    
    # Profile Management
    completeProfileInfo(input: ProfileInfoInput!): User!
    updateProfile(input: UpdateProfileInput!): User!
    updateAvatar(image: String!): User!
    updateCoverImage(image: String!): User!
    deleteAccount(password: String!): MessageResponse!
    
    # Verification
    submitVerificationDocuments(input: VerificationDocumentInput!): VerificationDocument!
    
    # Two Factor Authentication
    setupTwoFactor(input: TwoFactorSetupInput!): TwoFactorSetup!
    enableTwoFactor(input: VerifyTwoFactorInput!): MessageResponse!
    disableTwoFactor(input: VerifyTwoFactorInput!): MessageResponse!
    regenerateBackupCodes: [String!]!
    
    # Session Management
    terminateSession(sessionId: ID!): MessageResponse!
    terminateAllOtherSessions: MessageResponse!
    
    # Streak
    useStreakProtection: StreakInfo!
    
    # Profile Sharing
    generateShareableLink: String!
    generateQRCode: String!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    userUpdated(userId: ID!): User!
    achievementUnlocked: Achievement!
    badgeEarned: Badge!
    streakUpdated: StreakInfo!
  }
`;

export default userTypeDef;