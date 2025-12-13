// apps/backend/src/graphql/schema/typeDefs/admin/verificationManagement.typeDef.js

import { gql } from 'apollo-server-express';

const verificationManagementTypeDef = gql`
  # ============================================
  # ENUMS
  # ============================================
  
  enum VerificationStatus {
    PENDING
    UNDER_REVIEW
    APPROVED
    REJECTED
    EXPIRED
    REQUIRES_RESUBMISSION
  }

  enum VerificationType {
    NIN
    PASSPORT
    DRIVERS_LICENSE
    NATIONAL_ID
    VOTER_ID
  }

  enum VerificationDocumentType {
    NIN_SLIP
    NIN_CARD
    PASSPORT_BIO_PAGE
    DRIVERS_LICENSE_FRONT
    DRIVERS_LICENSE_BACK
    NATIONAL_ID_FRONT
    NATIONAL_ID_BACK
  }

  enum RejectionReason {
    INVALID_DOCUMENT
    EXPIRED_DOCUMENT
    UNCLEAR_IMAGE
    INFORMATION_MISMATCH
    SUSPECTED_FRAUD
    INCOMPLETE_SUBMISSION
    UNSUPPORTED_DOCUMENT_TYPE
    DUPLICATE_SUBMISSION
  }

  enum VerificationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum VerificationSortField {
    CREATED_AT
    UPDATED_AT
    PRIORITY
    STATUS
    USER_SUBSCRIPTION_TIER
  }

  # ============================================
  # TYPES
  # ============================================

  type VerificationDocument {
    id: ID!
    documentType: VerificationDocumentType!
    documentUrl: String!
    uploadedAt: DateTime!
    fileSize: Int
    mimeType: String
    isVerified: Boolean!
    verifiedAt: DateTime
    verifiedBy: Admin
  }

  type VerificationRequest {
    id: ID!
    user: User!
    verificationType: VerificationType!
    status: VerificationStatus!
    priority: VerificationPriority!
    
    # Document Information
    documents: [VerificationDocument!]!
    
    # User Provided Info
    documentNumber: String
    fullName: String!
    dateOfBirth: DateTime
    nationality: String!
    address: String
    
    # Nigerian Specific
    ninNumber: String
    
    # Processing Info
    submittedAt: DateTime!
    reviewStartedAt: DateTime
    processedAt: DateTime
    expiresAt: DateTime
    
    # Admin Processing
    assignedTo: Admin
    reviewedBy: Admin
    rejectionReason: RejectionReason
    rejectionNote: String
    adminNotes: String
    
    # Resubmission
    resubmissionCount: Int!
    maxResubmissions: Int!
    previousSubmissions: [VerificationRequest!]
    
    # Metadata
    ipAddress: String
    userAgent: String
    deviceInfo: String
    
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type VerificationQueue {
    pending: [VerificationRequest!]!
    underReview: [VerificationRequest!]!
    totalPending: Int!
    totalUnderReview: Int!
    averageProcessingTime: Float
    oldestPendingRequest: VerificationRequest
  }

  type VerificationStats {
    totalRequests: Int!
    pendingCount: Int!
    approvedCount: Int!
    rejectedCount: Int!
    expiredCount: Int!
    
    # Time-based Stats
    requestsToday: Int!
    requestsThisWeek: Int!
    requestsThisMonth: Int!
    
    # Processing Stats
    averageProcessingTimeHours: Float!
    approvalRate: Float!
    rejectionRate: Float!
    resubmissionRate: Float!
    
    # By Type
    byType: [VerificationTypeStats!]!
    byCountry: [VerificationCountryStats!]!
    
    # Fraud Detection
    suspectedFraudCount: Int!
    duplicateSubmissionCount: Int!
  }

  type VerificationTypeStats {
    type: VerificationType!
    count: Int!
    approvalRate: Float!
    averageProcessingTime: Float!
  }

  type VerificationCountryStats {
    country: String!
    count: Int!
    approvalRate: Float!
    mostCommonDocumentType: VerificationType!
  }

  type VerificationAdminActivity {
    id: ID!
    admin: Admin!
    action: String!
    verificationRequest: VerificationRequest!
    details: String
    performedAt: DateTime!
  }

  type VerificationBatchResult {
    success: Boolean!
    processedCount: Int!
    failedCount: Int!
    results: [VerificationBatchItemResult!]!
  }

  type VerificationBatchItemResult {
    requestId: ID!
    success: Boolean!
    error: String
  }

  type FraudAlert {
    id: ID!
    verificationRequest: VerificationRequest!
    alertType: String!
    severity: String!
    details: String!
    isResolved: Boolean!
    resolvedBy: Admin
    resolvedAt: DateTime
    createdAt: DateTime!
  }

  type VerificationSettings {
    autoExpireDays: Int!
    maxResubmissions: Int!
    requireManualReview: Boolean!
    enableFraudDetection: Boolean!
    allowedDocumentTypes: [VerificationType!]!
    countriesRequiringNIN: [String!]!
    prioritizeSubscribers: Boolean!
  }

  # ============================================
  # INPUTS
  # ============================================

  input VerificationQueueFilterInput {
    status: [VerificationStatus!]
    verificationType: [VerificationType!]
    priority: [VerificationPriority!]
    nationality: String
    assignedTo: ID
    dateFrom: DateTime
    dateTo: DateTime
    searchTerm: String
  }

  input VerificationListInput {
    filter: VerificationQueueFilterInput
    sortBy: VerificationSortField
    sortOrder: SortOrder
    page: Int
    limit: Int
  }

  input ApproveVerificationInput {
    requestId: ID!
    adminNotes: String
    verifiedDocuments: [ID!]!
  }

  input RejectVerificationInput {
    requestId: ID!
    reason: RejectionReason!
    rejectionNote: String!
    allowResubmission: Boolean!
  }

  input BulkVerificationActionInput {
    requestIds: [ID!]!
    action: String!
    reason: RejectionReason
    note: String
  }

  input AssignVerificationInput {
    requestId: ID!
    adminId: ID!
    priority: VerificationPriority
  }

  input UpdateVerificationSettingsInput {
    autoExpireDays: Int
    maxResubmissions: Int
    requireManualReview: Boolean
    enableFraudDetection: Boolean
    allowedDocumentTypes: [VerificationType!]
    prioritizeSubscribers: Boolean
  }

  input FraudAlertResolutionInput {
    alertId: ID!
    resolution: String!
    action: String!
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Queue Management
    verificationQueue: VerificationQueue! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    verificationRequests(input: VerificationListInput!): PaginatedVerificationRequests! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    verificationRequest(id: ID!): VerificationRequest @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Statistics
    verificationStats(dateFrom: DateTime, dateTo: DateTime): VerificationStats! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    verificationAdminActivity(adminId: ID, limit: Int): [VerificationAdminActivity!]! @auth(requires: [SUPER_ADMIN])
    
    # Fraud Detection
    fraudAlerts(resolved: Boolean, limit: Int): [FraudAlert!]! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Settings
    verificationSettings: VerificationSettings! @auth(requires: [SUPER_ADMIN])
    
    # Search
    searchVerificationRequests(query: String!, limit: Int): [VerificationRequest!]! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # User Verification History
    userVerificationHistory(userId: ID!): [VerificationRequest!]! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
  }

  type PaginatedVerificationRequests {
    requests: [VerificationRequest!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # Core Actions
    approveVerification(input: ApproveVerificationInput!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    rejectVerification(input: RejectVerificationInput!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Assignment
    assignVerification(input: AssignVerificationInput!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    unassignVerification(requestId: ID!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    claimVerification(requestId: ID!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Bulk Actions
    bulkApproveVerifications(requestIds: [ID!]!): VerificationBatchResult! @auth(requires: [SUPER_ADMIN])
    bulkRejectVerifications(input: BulkVerificationActionInput!): VerificationBatchResult! @auth(requires: [SUPER_ADMIN])
    
    # Priority Management
    updateVerificationPriority(requestId: ID!, priority: VerificationPriority!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Request Resubmission
    requestResubmission(requestId: ID!, note: String!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Admin Notes
    addVerificationNote(requestId: ID!, note: String!): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    
    # Fraud Handling
    flagAsFraud(requestId: ID!, details: String!): FraudAlert! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    resolveFraudAlert(input: FraudAlertResolutionInput!): FraudAlert! @auth(requires: [SUPER_ADMIN])
    
    # Settings
    updateVerificationSettings(input: UpdateVerificationSettingsInput!): VerificationSettings! @auth(requires: [SUPER_ADMIN])
    
    # Expiration
    expireOldRequests(daysOld: Int!): Int! @auth(requires: [SUPER_ADMIN])
    
    # Manual Override
    manuallyVerifyUser(userId: ID!, reason: String!): User! @auth(requires: [SUPER_ADMIN])
    revokeVerification(userId: ID!, reason: String!): User! @auth(requires: [SUPER_ADMIN])
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    newVerificationRequest: VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    verificationStatusChanged(requestId: ID): VerificationRequest! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
    newFraudAlert: FraudAlert! @auth(requires: [VERIFICATION_ADMIN, SUPER_ADMIN])
  }
`;

export default verificationManagementTypeDef;