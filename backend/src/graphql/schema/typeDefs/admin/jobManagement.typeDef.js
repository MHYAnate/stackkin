// apps/backend/src/graphql/schema/typeDefs/admin/jobManagement.typeDef.js
import { gql } from 'apollo-server-express';

export const jobManagementTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum JobStatus {
    DRAFT
    PENDING_PAYMENT
    PENDING_APPROVAL
    ACTIVE
    PAUSED
    FILLED
    EXPIRED
    CANCELLED
    SUSPENDED
    DELETED
  }

  enum JobModerationAction {
    APPROVE
    REJECT
    SUSPEND
    UNSUSPEND
    FEATURE
    UNFEATURE
    PIN
    UNPIN
    EXPIRE
    RENEW
    EDIT
    REQUEST_CHANGES
    ESCROW_RELEASE
    ESCROW_REFUND
  }

  enum JobType {
    FULL_TIME
    PART_TIME
    CONTRACT
    FREELANCE
    INTERNSHIP
    VOLUNTEER
    TEMPORARY
    REMOTE
    HYBRID
    ON_SITE
  }

  enum ExperienceLevel {
    ENTRY
    JUNIOR
    MID
    SENIOR
    LEAD
    EXECUTIVE
  }

  enum ApplicationStatus {
    PENDING
    REVIEWED
    SHORTLISTED
    INTERVIEW
    TEST
    OFFER
    HIRED
    REJECTED
    WITHDRAWN
    EXPIRED
  }

  enum CollaborationStatus {
    OPEN
    IN_PROGRESS
    COMPLETED
    CANCELLED
    DISPUTED
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input JobFilterInput {
    # Basic Filters
    search: String
    title: String
    description: String
    company: String
    
    # Status Filters
    status: JobStatus
    type: JobType
    experienceLevel: ExperienceLevel
    
    # User Filters
    userId: ID
    employerVerified: Boolean
    employerSubscriptionTier: SubscriptionTier
    
    # Location Filters
    location: String
    country: String
    remote: Boolean
    hybrid: Boolean
    
    # Category Filters
    category: String
    subcategory: String
    tags: [String!]
    techStack: [String!]
    
    # Salary Filters
    minSalary: Int
    maxSalary: Int
    salaryCurrency: Currency
    hasSalary: Boolean
    
    # Date Filters
    createdFrom: DateTime
    createdTo: DateTime
    expiresFrom: DateTime
    expiresTo: DateTime
    
    # Application Filters
    minApplications: Int
    maxApplications: Int
    applicationsOpen: Boolean
    
    # Quality Filters
    featured: Boolean
    pinned: Boolean
    premium: Boolean
    urgent: Boolean
  }

  input JobModerationInput {
    jobId: ID!
    action: JobModerationAction!
    reason: String
    notes: String
    changes: JSON
    notifyUser: Boolean
    notificationMessage: String
  }

  input JobEditInput {
    jobId: ID!
    title: String
    description: String
    company: String
    location: String
    country: String
    type: JobType
    experienceLevel: ExperienceLevel
    category: String
    subcategory: String
    tags: [String!]
    techStack: [String!]
    salaryMin: Int
    salaryMax: Int
    salaryCurrency: Currency
    benefits: [String!]
    requirements: [String!]
    responsibilities: [String!]
    applicationInstructions: String
    applicationDeadline: DateTime
    notes: String
  }

  input ApplicationFilterInput {
    jobId: ID
    userId: ID
    status: ApplicationStatus
    experienceMatch: Boolean
    locationMatch: Boolean
    salaryExpectationMatch: Boolean
    createdFrom: DateTime
    createdTo: DateTime
    search: String
  }

  input ApplicationActionInput {
    applicationId: ID!
    action: ApplicationAction!
    reason: String
    notes: String
    notifyUser: Boolean
    notificationMessage: String
  }

  input CollaborationFilterInput {
    status: CollaborationStatus
    type: JobType
    userId: ID
    search: String
    createdFrom: DateTime
    createdTo: DateTime
  }

  input EscrowActionInput {
    jobId: ID!
    action: EscrowAction!
    amount: Int
    reason: String
    notes: String
    notifyParties: Boolean
  }

  enum ApplicationAction {
    REVIEW
    SHORTLIST
    REJECT
    INTERVIEW
    TEST
    OFFER
    HIRE
    WITHDRAW
    ARCHIVE
  }

  enum EscrowAction {
    CREATE
    FUND
    RELEASE
    REFUND
    DISPUTE
    RESOLVE
  }

  # ==========================================
  # TYPES
  # ==========================================

  type JobManagementStats {
    # Counts
    totalJobs: Int!
    newJobsToday: Int!
    newJobsThisWeek: Int!
    newJobsThisMonth: Int!
    
    # Status Breakdown
    activeJobs: Int!
    pendingApproval: Int!
    pendingPayment: Int!
    filledJobs: Int!
    expiredJobs: Int!
    suspendedJobs: Int!
    
    # Type Breakdown
    byType: [JobTypeStats!]!
    byExperience: [ExperienceStats!]!
    
    # Applications
    totalApplications: Int!
    pendingApplications: Int!
    hiredCount: Int!
    applicationRate: Float!
    
    # Financial
    totalRevenue: Int!
    revenueToday: Int!
    pendingEscrow: Int!
    refundedAmount: Int!
    
    # Quality
    featuredJobs: Int!
    pinnedJobs: Int!
    premiumJobs: Int!
    
    # Growth
    jobGrowthRate: Float!
    applicationGrowthRate: Float!
    hireRate: Float!
  }

  type JobDetail {
    # Job Info
    job: Job!
    
    # Admin Data
    moderationHistory: [JobModerationLog!]!
    adminNotes: [AdminNote!]!
    paymentHistory: [PaymentRecord!]!
    escrowDetails: EscrowDetail
    
    # Applications
    applications: [ApplicationDetail!]!
    applicationStats: ApplicationStats!
    
    # Performance
    analytics: JobAnalytics!
    engagement: JobEngagement!
    quality: JobQuality!
    
    # Similar Jobs
    similarJobs: [Job!]!
    employerJobs: [Job!]!
  }

  type JobModerationLog {
    id: ID!
    job: Job!
    admin: Admin!
    action: JobModerationAction!
    
    # Details
    reason: String
    notes: String
    changes: JSON
    ipAddress: String
    userAgent: String
    
    # Financial Impact
    amount: Int
    escrowAction: Boolean
    
    # Notification
    notifiedUser: Boolean!
    notificationMessage: String
    
    # Timestamps
    createdAt: DateTime!
  }

  type PaymentRecord {
    id: ID!
    job: Job!
    user: User!
    amount: Int!
    currency: Currency!
    status: PaymentStatus!
    
    # Details
    paymentMethod: PaymentMethod!
    transactionId: String!
    gatewayResponse: JSON
    
    # Escrow
    escrowId: ID
    escrowStatus: EscrowStatus
    
    # Refunds
    refunded: Boolean!
    refundAmount: Int
    refundReason: String
    
    # Timestamps
    createdAt: DateTime!
    processedAt: DateTime
  }

  type EscrowDetail {
    id: ID!
    job: Job!
    amount: Int!
    currency: Currency!
    status: EscrowStatus!
    
    # Parties
    employer: User!
    employee: User
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

  type ApplicationDetail {
    id: ID!
    job: Job!
    applicant: User!
    status: ApplicationStatus!
    
    # Application Content
    coverLetter: String
    resume: String
    portfolio: String
    salaryExpectation: Int
    availability: String
    
    # Evaluation
    score: Float
    matchPercentage: Float
    strengths: [String!]
    weaknesses: [String!]
    
    # Process
    reviewNotes: [ReviewNote!]!
    interviews: [Interview!]!
    tests: [TestResult!]!
    offers: [Offer!]!
    
    # Timeline
    appliedAt: DateTime!
    updatedAt: DateTime!
    lastActionAt: DateTime
  }

  type ReviewNote {
    id: ID!
    application: ApplicationDetail!
    reviewer: Admin!
    note: String!
    category: ReviewCategory!
    rating: Int
    timestamp: DateTime!
  }

  enum ReviewCategory {
    EXPERIENCE
    SKILLS
    CULTURE_FIT
    COMMUNICATION
    PORTFOLIO
    EDUCATION
    OTHER
  }

  type Interview {
    id: ID!
    application: ApplicationDetail!
    scheduledBy: Admin!
    scheduledFor: DateTime!
    duration: Int!
    type: InterviewType!
    platform: String
    link: String
    
    # Status
    status: InterviewStatus!
    completed: Boolean!
    notes: String
    rating: Int
    
    # Participants
    participants: [User!]!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum InterviewType {
    PHONE
    VIDEO
    IN_PERSON
    TECHNICAL
    BEHAVIORAL
    PANEL
  }

  enum InterviewStatus {
    SCHEDULED
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    NO_SHOW
  }

  type TestResult {
    id: ID!
    application: ApplicationDetail!
    test: Test!
    score: Float!
    maxScore: Float!
    duration: Int!
    passed: Boolean!
    
    # Details
    answers: JSON
    feedback: String
    reviewedBy: Admin
    reviewedAt: DateTime
    
    # Timestamps
    startedAt: DateTime!
    completedAt: DateTime!
  }

  type Test {
    id: ID!
    name: String!
    description: String!
    type: TestType!
    duration: Int!
    questions: [Question!]!
    passingScore: Float!
    active: Boolean!
  }

  enum TestType {
    TECHNICAL
    PERSONALITY
    SKILLS
    CODING
    LOGICAL
    LANGUAGE
  }

  type Question {
    id: ID!
    text: String!
    type: QuestionType!
    options: [String!]
    correctAnswer: String
    points: Int!
  }

  enum QuestionType {
    MULTIPLE_CHOICE
    TRUE_FALSE
    SHORT_ANSWER
    ESSAY
    CODE
    FILE_UPLOAD
  }

  type Offer {
    id: ID!
    application: ApplicationDetail!
    offeredBy: Admin!
    offeredTo: User!
    salary: Int!
    currency: Currency!
    benefits: [String!]!
    startDate: DateTime!
    notes: String
    
    # Status
    status: OfferStatus!
    accepted: Boolean
    acceptedAt: DateTime
    rejectedReason: String
    
    # Timestamps
    createdAt: DateTime!
    expiresAt: DateTime!
  }

  enum OfferStatus {
    PENDING
    ACCEPTED
    REJECTED
    EXPIRED
    WITHDRAWN
  }

  type ApplicationStats {
    totalApplications: Int!
    pendingReview: Int!
    shortlisted: Int!
    interviewed: Int!
    tested: Int!
    offered: Int!
    hired: Int!
    rejected: Int!
    withdrawn: Int!
    
    averageScore: Float!
    averageResponseTime: Int!
    conversionRate: Float!
  }

  type JobAnalytics {
    # Views
    totalViews: Int!
    uniqueViews: Int!
    viewsToday: Int!
    viewsThisWeek: Int!
    viewsThisMonth: Int!
    
    # Applications
    applicationRate: Float!
    qualityApplications: Int!
    spamApplications: Int!
    
    # Engagement
    timeSpent: Int!
    bounceRate: Float!
    shares: Int!
    saves: Int!
    
    # Performance
    fillTime: Int!
    costPerHire: Float!
    qualityOfHire: Float!
    
    # Employer
    employerSatisfaction: Float!
    rehireRate: Float!
  }

  type JobEngagement {
    # User Engagement
    clickThroughRate: Float!
    applicationStartRate: Float!
    completionRate: Float!
    
    # Social Engagement
    socialShares: Int!
    referralApplications: Int!
    
    # Employer Engagement
    employerResponseRate: Float!
    employerResponseTime: Int!
    
    # Candidate Engagement
    candidateResponseRate: Float!
    candidateResponseTime: Int!
  }

  type JobQuality {
    # Content Quality
    completeness: Float!
    clarity: Float!
    accuracy: Float!
    
    # Employer Quality
    employerRating: Float!
    responseRate: Float!
    rehireRate: Float!
    
    # Process Quality
    applicationProcess: Float!
    communication: Float!
    feedback: Float!
    
    # Outcome Quality
    hireQuality: Float!
    retentionRate: Float!
    satisfaction: Float!
  }

  type JobTypeStats {
    type: JobType!
    count: Int!
    applications: Int!
    hires: Int!
    revenue: Int!
  }

  type ExperienceStats {
    level: ExperienceLevel!
    count: Int!
    averageSalary: Int!
    applicationRate: Float!
    hireRate: Float!
  }

  type CollaborationDetail {
    id: ID!
    job: Job!
    status: CollaborationStatus!
    
    # Team
    creator: User!
    collaborators: [Collaborator!]!
    applicants: [User!]!
    
    # Project
    title: String!
    description: String!
    goals: [String!]!
    timeline: Timeline!
    
    # Management
    tasks: [Task!]!
    milestones: [Milestone!]!
    discussions: [Discussion!]!
    
    # Outcomes
    deliverables: [Deliverable!]!
    feedback: [Feedback!]!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
    completedAt: DateTime
  }

  type Collaborator {
    user: User!
    role: String!
    joinedAt: DateTime!
    contribution: Float!
    status: CollaboratorStatus!
  }

  enum CollaboratorStatus {
    ACTIVE
    INACTIVE
    REMOVED
    COMPLETED
  }

  type Timeline {
    startDate: DateTime!
    endDate: DateTime!
    milestones: [Milestone!]!
    progress: Float!
  }

  type Task {
    id: ID!
    title: String!
    description: String!
    assignee: User!
    status: TaskStatus!
    priority: Priority!
    dueDate: DateTime!
    completedAt: DateTime
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    REVIEW
    COMPLETED
    BLOCKED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type Milestone {
    id: ID!
    title: String!
    description: String!
    dueDate: DateTime!
    completed: Boolean!
    completedAt: DateTime
    deliverables: [String!]!
  }

  type Discussion {
    id: ID!
    title: String!
    creator: User!
    messages: [Message!]!
    resolved: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Deliverable {
    id: ID!
    title: String!
    description: String!
    type: DeliverableType!
    url: String
    submittedBy: User!
    submittedAt: DateTime!
    approved: Boolean
    approvedBy: User
    approvedAt: DateTime
    feedback: String
  }

  enum DeliverableType {
    CODE
    DESIGN
    DOCUMENTATION
    PRESENTATION
    REPORT
    OTHER
  }

  type Feedback {
    id: ID!
    giver: User!
    receiver: User!
    rating: Int!
    comments: String
    categories: [String!]!
    timestamp: DateTime!
  }

  type JobDashboard {
    # Overview
    stats: JobManagementStats!
    
    # Recent Activity
    recentJobs: [JobDetail!]!
    recentApplications: [ApplicationDetail!]!
    recentModerations: [JobModerationLog!]!
    
    # Pending Actions
    pendingApprovals: [Job!]!
    pendingEscrows: [EscrowDetail!]!
    pendingDisputes: [DisputeDetail!]!
    
    # Performance
    topPerformingJobs: [JobDetail!]!
    slowFillingJobs: [JobDetail!]!
    highApplicationJobs: [JobDetail!]!
    
    # Employer Performance
    topEmployers: [User!]!
    problematicEmployers: [User!]!
    
    # Generated At
    generatedAt: DateTime!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Job Management
    jobManagementStats: JobManagementStats!
    jobDashboard: JobDashboard!
    
    jobs(
      filter: JobFilterInput
      pagination: PaginationInput
      sort: JobSortInput
    ): JobConnection!
    
    jobDetail(jobId: ID!): JobDetail!
    
    # Applications
    applications(
      filter: ApplicationFilterInput
      pagination: PaginationInput
    ): ApplicationConnection!
    
    applicationDetail(applicationId: ID!): ApplicationDetail!
    
    # Escrow & Payments
    jobEscrows(
      status: EscrowStatus
      pagination: PaginationInput
    ): [EscrowDetail!]!
    
    escrowDetail(escrowId: ID!): EscrowDetail!
    
    # Collaborations
    collaborations(
      filter: CollaborationFilterInput
      pagination: PaginationInput
    ): [CollaborationDetail!]!
    
    collaborationDetail(collaborationId: ID!): CollaborationDetail!
    
    # Moderation
    moderationHistory(
      jobId: ID
      action: JobModerationAction
      startDate: DateTime
      endDate: DateTime
      pagination: PaginationInput
    ): [JobModerationLog!]!
    
    # Tests
    tests(active: Boolean): [Test!]!
    testDetail(testId: ID!): Test!
    
    # Analytics
    jobAnalytics(
      jobId: ID
      startDate: DateTime
      endDate: DateTime
      groupBy: GroupBy
    ): [JobAnalytics!]!
  }

  input JobSortInput {
    field: JobSortField!
    order: SortOrder!
  }

  enum JobSortField {
    CREATED_AT
    UPDATED_AT
    EXPIRES_AT
    SALARY
    APPLICATIONS
    VIEWS
    URGENCY
  }

  type JobConnection {
    edges: [JobEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    stats: JobManagementStats!
  }

  type JobEdge {
    node: Job!
    cursor: String!
  }

  type ApplicationConnection {
    edges: [ApplicationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ApplicationEdge {
    node: ApplicationDetail!
    cursor: String!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Job Moderation
    moderateJob(input: JobModerationInput!): JobModerationLog!
    editJob(input: JobEditInput!): Job!
    
    # Status Management
    approveJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    rejectJob(jobId: ID!, reason: String!, refund: Boolean, notifyUser: Boolean): Job!
    suspendJob(jobId: ID!, reason: String!, duration: Int, notifyUser: Boolean): Job!
    unsuspendJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    featureJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    unfeatureJob(jobId: ID!, reason: String): Job!
    pinJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    unpinJob(jobId: ID!, reason: String): Job!
    expireJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    renewJob(jobId: ID!, reason: String, notifyUser: Boolean): Job!
    
    # Applications
    reviewApplication(input: ApplicationActionInput!): ApplicationDetail!
    scheduleInterview(
      applicationId: ID!
      scheduledFor: DateTime!
      duration: Int!
      type: InterviewType!
      platform: String
      link: String
      notes: String
    ): Interview!
    
    assignTest(applicationId: ID!, testId: ID!, deadline: DateTime): TestResult!
    submitTestResult(testResultId: ID!, score: Float!, feedback: String): TestResult!
    
    makeOffer(
      applicationId: ID!
      salary: Int!
      currency: Currency!
      benefits: [String!]!
      startDate: DateTime!
      notes: String
      expiresIn: Int
    ): Offer!
    
    withdrawOffer(offerId: ID!, reason: String): Offer!
    
    # Escrow Management
    manageEscrow(input: EscrowActionInput!): EscrowDetail!
    releaseEscrow(escrowId: ID!, amount: Int!, toUserId: ID!, reason: String): EscrowRelease!
    refundEscrow(escrowId: ID!, reason: String!): EscrowDetail!
    
    # Disputes
    createDispute(escrowId: ID!, initiatorId: ID!, reason: String!, description: String!): DisputeDetail!
    resolveDispute(disputeId: ID!, resolution: JSON!): DisputeDetail!
    
    # Tests
    createTest(input: TestInput!): Test!
    updateTest(testId: ID!, input: TestInput!): Test!
    deleteTest(testId: ID!): MessageResponse!
    
    # Collaborations
    manageCollaboration(collaborationId: ID!, action: CollaborationAction!, notes: String): CollaborationDetail!
    addCollaborator(collaborationId: ID!, userId: ID!, role: String!): CollaborationDetail!
    removeCollaborator(collaborationId: ID!, userId: ID!, reason: String): CollaborationDetail!
    
    # Payments
    processRefund(paymentId: ID!, amount: Int!, reason: String!): PaymentRecord!
    
    # Communication
    notifyJobOwner(jobId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
    notifyApplicant(applicationId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
    notifyAllApplicants(jobId: ID!, subject: String!, message: String!, type: NotificationType): MessageResponse!
  }

  input TestInput {
    name: String!
    description: String!
    type: TestType!
    duration: Int!
    questions: [QuestionInput!]!
    passingScore: Float!
    active: Boolean!
  }

  input QuestionInput {
    text: String!
    type: QuestionType!
    options: [String!]
    correctAnswer: String
    points: Int!
  }

  enum CollaborationAction {
    APPROVE
    REJECT
    SUSPEND
    COMPLETE
    ARCHIVE
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    jobModerated: JobModerationLog!
    applicationUpdated(applicationId: ID!): ApplicationDetail!
    escrowUpdated(escrowId: ID!): EscrowDetail!
    collaborationUpdated(collaborationId: ID!): CollaborationDetail!
  }
`;

export default jobManagementTypeDef;