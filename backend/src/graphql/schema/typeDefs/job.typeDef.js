// apps/backend/src/graphql/schema/typeDefs/job.typeDef.js

import { gql } from 'apollo-server-express';

export const jobTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum JobType {
    FULL_TIME
    PART_TIME
    CONTRACT
    FREELANCE
    INTERNSHIP
    TEMPORARY
  }

  enum JobLocation {
    REMOTE
    ON_SITE
    HYBRID
  }

  enum ExperienceLevel {
    ENTRY
    JUNIOR
    MID
    SENIOR
    LEAD
    EXECUTIVE
  }

  enum JobStatus {
    DRAFT
    PENDING_PAYMENT
    PENDING_REVIEW
    PUBLISHED
    CLOSED
    EXPIRED
    SUSPENDED
    FILLED
  }

  enum ApplicationStatus {
    PENDING
    VIEWED
    SHORTLISTED
    INTERVIEWING
    OFFERED
    HIRED
    REJECTED
    WITHDRAWN
  }

  enum CollaborationType {
    OPEN_SOURCE
    STARTUP
    SIDE_PROJECT
    HACKATHON
    LEARNING_PARTNER
    RESEARCH
    OTHER
  }

  enum SalaryType {
    HOURLY
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
    PROJECT_BASED
    NEGOTIABLE
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateJobInput {
    title: String!
    description: String!
    shortDescription: String!
    company: CompanyInput!
    
    # Job Details
    type: JobType!
    location: JobLocation!
    locationDetails: String
    country: String
    city: String
    timezone: String
    
    # Requirements
    experienceLevel: ExperienceLevel!
    techStack: [String!]!
    skills: [String!]!
    requirements: [String!]!
    responsibilities: [String!]!
    niceToHave: [String!]
    
    # Compensation
    salaryType: SalaryType!
    salaryMin: Float
    salaryMax: Float
    currency: String!
    benefits: [String!]
    
    # Application
    applicationDeadline: DateTime
    applicationUrl: String
    applicationEmail: String!
    applicationInstructions: String
    
    # Settings
    isUrgent: Boolean
    isFeatured: Boolean
    tags: [String!]
  }

  input UpdateJobInput {
    title: String
    description: String
    shortDescription: String
    company: CompanyInput
    type: JobType
    location: JobLocation
    locationDetails: String
    country: String
    city: String
    timezone: String
    experienceLevel: ExperienceLevel
    techStack: [String!]
    skills: [String!]
    requirements: [String!]
    responsibilities: [String!]
    niceToHave: [String!]
    salaryType: SalaryType
    salaryMin: Float
    salaryMax: Float
    currency: String
    benefits: [String!]
    applicationDeadline: DateTime
    applicationUrl: String
    applicationEmail: String
    applicationInstructions: String
    isUrgent: Boolean
    tags: [String!]
  }

  input CompanyInput {
    name: String!
    logo: String
    website: String
    description: String
    size: CompanySize
    industry: String
    location: String
  }

  input CreateCollaborationInput {
    title: String!
    description: String!
    type: CollaborationType!
    techStack: [String!]!
    skills: [String!]!
    rolesNeeded: [RoleNeededInput!]!
    commitment: String!
    duration: String
    startDate: DateTime
    isRemote: Boolean!
    location: String
    tags: [String!]
    projectUrl: String
    repositoryUrl: String
    contactEmail: String!
  }

  input RoleNeededInput {
    title: String!
    description: String!
    skills: [String!]!
    spots: Int!
  }

  input UpdateCollaborationInput {
    title: String
    description: String
    type: CollaborationType
    techStack: [String!]
    skills: [String!]
    rolesNeeded: [RoleNeededInput!]
    commitment: String
    duration: String
    startDate: DateTime
    isRemote: Boolean
    location: String
    tags: [String!]
    projectUrl: String
    repositoryUrl: String
    contactEmail: String
  }

  input JobApplicationInput {
    jobId: ID!
    coverLetter: String!
    resume: String
    portfolioUrl: String
    linkedinUrl: String
    githubUrl: String
    expectedSalary: Float
    availableFrom: DateTime
    additionalInfo: String
    answers: [ApplicationAnswerInput!]
  }

  input ApplicationAnswerInput {
    questionId: ID!
    answer: String!
  }

  input CollaborationApplicationInput {
    collaborationId: ID!
    roleId: ID!
    message: String!
    portfolioUrl: String
    availability: String!
  }

  input JobFilterInput {
    type: [JobType!]
    location: [JobLocation!]
    experienceLevel: [ExperienceLevel!]
    techStack: [String!]
    skills: [String!]
    country: String
    city: String
    salaryMin: Float
    salaryMax: Float
    currency: String
    isRemote: Boolean
    isUrgent: Boolean
    isFeatured: Boolean
    postedWithin: Int # days
    search: String
    authorId: ID
    status: JobStatus
    tags: [String!]
    sortBy: JobSortBy
    sortOrder: SortOrder
  }

  enum JobSortBy {
    CREATED_AT
    SALARY
    DEADLINE
    RELEVANCE
    VIEWS
  }

  input CollaborationFilterInput {
    type: [CollaborationType!]
    techStack: [String!]
    skills: [String!]
    isRemote: Boolean
    search: String
    authorId: ID
    status: CollaborationStatus
    sortBy: CollaborationSortBy
    sortOrder: SortOrder
  }

  enum CollaborationSortBy {
    CREATED_AT
    START_DATE
    RELEVANCE
  }

  enum CollaborationStatus {
    OPEN
    CLOSED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum CompanySize {
    STARTUP
    SMALL
    MEDIUM
    LARGE
    ENTERPRISE
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Job {
    id: ID!
    title: String!
    slug: String!
    description: String!
    shortDescription: String!
    
    # Company
    company: Company!
    
    # Job Details
    type: JobType!
    location: JobLocation!
    locationDetails: String
    country: String
    city: String
    timezone: String
    
    # Requirements
    experienceLevel: ExperienceLevel!
    techStack: [String!]!
    skills: [String!]!
    requirements: [String!]!
    responsibilities: [String!]!
    niceToHave: [String!]!
    
    # Compensation
    salaryType: SalaryType!
    salaryMin: Float
    salaryMax: Float
    currency: String!
    salaryDisplay: String
    benefits: [String!]!
    
    # Application
    applicationDeadline: DateTime
    applicationUrl: String
    applicationEmail: String!
    applicationInstructions: String
    screeningQuestions: [ScreeningQuestion!]!
    
    # Status & Visibility
    status: JobStatus!
    isUrgent: Boolean!
    isFeatured: Boolean!
    isPremium: Boolean!
    isGloballyPinned: Boolean!
    
    # Author & Pricing
    author: User!
    postingTier: SubscriptionTier!
    postingPrice: Float!
    paymentReference: String
    
    # Stats
    views: Int!
    clicks: Int!
    applications: [JobApplication!]!
    applicationsCount: Int!
    
    # Tags
    tags: [String!]!
    
    # Timestamps
    publishedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Company {
    name: String!
    logo: String
    website: String
    description: String
    size: CompanySize
    industry: String
    location: String
  }

  type ScreeningQuestion {
    id: ID!
    question: String!
    isRequired: Boolean!
    type: QuestionType!
    options: [String!]
  }

  enum QuestionType {
    TEXT
    TEXTAREA
    SINGLE_CHOICE
    MULTIPLE_CHOICE
    YES_NO
  }

  type JobApplication {
    id: ID!
    job: Job!
    applicant: User!
    coverLetter: String!
    resume: String
    portfolioUrl: String
    linkedinUrl: String
    githubUrl: String
    expectedSalary: Float
    availableFrom: DateTime
    additionalInfo: String
    answers: [ApplicationAnswer!]!
    status: ApplicationStatus!
    notes: String
    rating: Int
    viewedAt: DateTime
    shortlistedAt: DateTime
    interviewScheduledAt: DateTime
    offeredAt: DateTime
    hiredAt: DateTime
    rejectedAt: DateTime
    rejectionReason: String
    withdrawnAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ApplicationAnswer {
    questionId: ID!
    question: String!
    answer: String!
  }

  type Collaboration {
    id: ID!
    title: String!
    slug: String!
    description: String!
    type: CollaborationType!
    author: User!
    techStack: [String!]!
    skills: [String!]!
    rolesNeeded: [RoleNeeded!]!
    commitment: String!
    duration: String
    startDate: DateTime
    isRemote: Boolean!
    location: String
    projectUrl: String
    repositoryUrl: String
    contactEmail: String!
    tags: [String!]!
    status: CollaborationStatus!
    views: Int!
    applications: [CollaborationApplication!]!
    applicationsCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RoleNeeded {
    id: ID!
    title: String!
    description: String!
    skills: [String!]!
    spots: Int!
    filledSpots: Int!
    isFilled: Boolean!
  }

  type CollaborationApplication {
    id: ID!
    collaboration: Collaboration!
    role: RoleNeeded!
    applicant: User!
    message: String!
    portfolioUrl: String
    availability: String!
    status: ApplicationStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type JobConnection {
    edges: [JobEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type JobEdge {
    node: Job!
    cursor: String!
  }

  type CollaborationConnection {
    edges: [CollaborationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CollaborationEdge {
    node: Collaboration!
    cursor: String!
  }

  type ApplicationConnection {
    edges: [ApplicationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ApplicationEdge {
    node: JobApplication!
    cursor: String!
  }

  type JobPostingPrice {
    tier: SubscriptionTier!
    price: Float!
    currency: String!
    features: [String!]!
    freePostingsRemaining: Int
    totalPostingsAllowed: Int
  }

  type JobPaymentResult {
    success: Boolean!
    job: Job
    paymentUrl: String
    paymentReference: String
    message: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Jobs
    job(id: ID!): Job
    jobBySlug(slug: String!): Job
    jobs(
      filter: JobFilterInput
      pagination: PaginationInput
    ): JobConnection!
    
    myJobs(
      filter: JobFilterInput
      pagination: PaginationInput
    ): JobConnection!
    
    # Featured Jobs
    featuredJobs(limit: Int): [Job!]!
    premiumJobs(pagination: PaginationInput): JobConnection!
    urgentJobs(limit: Int): [Job!]!
    
    # Collaborations
    collaboration(id: ID!): Collaboration
    collaborations(
      filter: CollaborationFilterInput
      pagination: PaginationInput
    ): CollaborationConnection!
    
    myCollaborations(pagination: PaginationInput): CollaborationConnection!
    
    # Applications
    myJobApplications(
      status: ApplicationStatus
      pagination: PaginationInput
    ): ApplicationConnection!
    
    jobApplications(
      jobId: ID!
      status: ApplicationStatus
      pagination: PaginationInput
    ): ApplicationConnection!
    
    application(id: ID!): JobApplication
    
    # Pricing
    jobPostingPrice: JobPostingPrice!
    
    # Search
    searchJobs(
      query: String!
      filter: JobFilterInput
      pagination: PaginationInput
    ): JobConnection!
    
    # Suggestions
    suggestedJobs(limit: Int): [Job!]!
    similarJobs(jobId: ID!, limit: Int): [Job!]!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Jobs CRUD
    createJob(input: CreateJobInput!): JobPaymentResult!
    updateJob(id: ID!, input: UpdateJobInput!): Job!
    deleteJob(id: ID!): MessageResponse!
    
    # Job Actions
    publishJob(id: ID!): Job!
    closeJob(id: ID!): Job!
    reopenJob(id: ID!): Job!
    
    # Screening Questions
    addScreeningQuestion(
      jobId: ID!
      question: String!
      isRequired: Boolean!
      type: QuestionType!
      options: [String!]
    ): Job!
    removeScreeningQuestion(jobId: ID!, questionId: ID!): Job!
    
    # Job Interactions
    viewJob(id: ID!): Job!
    saveJob(id: ID!): MessageResponse!
    unsaveJob(id: ID!): MessageResponse!
    
    # Applications
    applyToJob(input: JobApplicationInput!): JobApplication!
    withdrawApplication(id: ID!): MessageResponse!
    
    # Application Management (Job Owner)
    viewApplication(id: ID!): JobApplication!
    shortlistApplication(id: ID!): JobApplication!
    rejectApplication(id: ID!, reason: String): JobApplication!
    scheduleInterview(id: ID!, scheduledAt: DateTime!): JobApplication!
    makeOffer(id: ID!, details: String): JobApplication!
    hireApplicant(id: ID!): JobApplication!
    addApplicationNote(id: ID!, note: String!): JobApplication!
    rateApplicant(id: ID!, rating: Int!): JobApplication!
    
    # Collaborations
    createCollaboration(input: CreateCollaborationInput!): Collaboration!
    updateCollaboration(id: ID!, input: UpdateCollaborationInput!): Collaboration!
    deleteCollaboration(id: ID!): MessageResponse!
    closeCollaboration(id: ID!): Collaboration!
    
    # Collaboration Applications
    applyToCollaboration(input: CollaborationApplicationInput!): CollaborationApplication!
    acceptCollaborator(applicationId: ID!): CollaborationApplication!
    rejectCollaborator(applicationId: ID!, reason: String): CollaborationApplication!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    jobCreated: Job!
    jobUpdated(id: ID!): Job!
    newApplication(jobId: ID!): JobApplication!
    applicationStatusChanged(applicantId: ID!): JobApplication!
    collaborationCreated: Collaboration!
  }
`;

export default jobTypeDef;