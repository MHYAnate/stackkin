// apps/backend/src/graphql/schema/typeDefs/squad.typeDef.js

import { gql } from 'apollo-server-express';

export const squadTypeDef = gql`
  # ==========================================
  # ENUMS
  # ==========================================

  enum SquadStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
    DISBANDED
  }

  enum SquadMemberRole {
    LEADER
    CO_LEADER
    MEMBER
  }

  enum SquadMemberStatus {
    ACTIVE
    INACTIVE
    REMOVED
  }

  enum SquadApplicationStatus {
    PENDING
    ACCEPTED
    REJECTED
    WITHDRAWN
  }

  enum SquadVisibility {
    PUBLIC
    PRIVATE
    INVITE_ONLY
  }

  # ==========================================
  # INPUT TYPES
  # ==========================================

  input CreateSquadInput {
    name: String!
    slug: String!
    tagline: String!
    description: String!
    logo: String
    coverImage: String
    techStack: [String!]!
    services: [String!]!
    industries: [String!]
    location: String
    website: String
    github: String
    linkedin: String
    twitter: String
    visibility: SquadVisibility!
    isOpenToMembers: Boolean!
    maxMembers: Int
  }

  input UpdateSquadInput {
    name: String
    tagline: String
    description: String
    logo: String
    coverImage: String
    techStack: [String!]
    services: [String!]
    industries: [String!]
    location: String
    website: String
    github: String
    linkedin: String
    twitter: String
    visibility: SquadVisibility
    isOpenToMembers: Boolean
    maxMembers: Int
  }

  input SquadApplicationInput {
    squadId: ID!
    message: String!
    role: String
    portfolio: String
    availability: String!
  }

  input InviteMemberInput {
    squadId: ID!
    userId: ID!
    role: SquadMemberRole!
    message: String
  }

  input SquadFilterInput {
    techStack: [String!]
    services: [String!]
    industries: [String!]
    location: String
    isVerified: Boolean
    minMembers: Int
    maxMembers: Int
    isOpenToMembers: Boolean
    search: String
    sortBy: SquadSortBy
    sortOrder: SortOrder
  }

  enum SquadSortBy {
    CREATED_AT
    MEMBERS_COUNT
    RATING
    PROJECTS_COMPLETED
    NAME
  }

  # ==========================================
  # TYPES
  # ==========================================

  type Squad {
    id: ID!
    name: String!
    slug: String!
    tagline: String!
    description: String!
    logo: String
    coverImage: String
    
    # Tech & Services
    techStack: [String!]!
    services: [String!]!
    industries: [String!]!
    
    # Location & Links
    location: String
    website: String
    github: String
    linkedin: String
    twitter: String
    
    # Members
    leader: User!
    members: [SquadMember!]!
    membersCount: Int!
    verifiedMembersCount: Int!
    
    # Settings
    visibility: SquadVisibility!
    isOpenToMembers: Boolean!
    maxMembers: Int
    
    # Verification (based on member verification)
    verificationRatio: Float!
    isVerified: Boolean!
    
    # Stats
    stats: SquadStats!
    averageRating: Float!
    
    # Applications
    pendingApplications: [SquadApplication!]!
    pendingApplicationsCount: Int!
    
    # Status
    status: SquadStatus!
    
    # Chat Room
    chatRoom: ChatRoom
    
    # Portfolio
    completedProjects: [SquadProject!]!
    completedProjectsCount: Int!
    
    # Timestamps
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SquadMember {
    id: ID!
    squad: Squad!
    user: User!
    role: SquadMemberRole!
    title: String
    status: SquadMemberStatus!
    joinedAt: DateTime!
    leftAt: DateTime
    contributionScore: Int!
    projectsContributed: Int!
  }

  type SquadStats {
    totalProjects: Int!
    completedProjects: Int!
    totalRatings: Int!
    averageRating: Float!
    totalEarnings: Float
    profileViews: Int!
    memberRetentionRate: Float!
  }

  type SquadApplication {
    id: ID!
    squad: Squad!
    applicant: User!
    message: String!
    role: String
    portfolio: String
    availability: String!
    status: SquadApplicationStatus!
    reviewedBy: User
    reviewedAt: DateTime
    rejectionReason: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SquadInvitation {
    id: ID!
    squad: Squad!
    invitee: User!
    invitedBy: User!
    role: SquadMemberRole!
    message: String
    status: SquadApplicationStatus!
    respondedAt: DateTime
    expiresAt: DateTime!
    createdAt: DateTime!
  }

  type SquadProject {
    id: ID!
    squad: Squad!
    title: String!
    description: String!
    client: String
    techStack: [String!]!
    images: [String!]!
    projectUrl: String
    completedAt: DateTime!
    rating: Float
    testimonial: String
  }

  type SquadConnection {
    edges: [SquadEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SquadEdge {
    node: Squad!
    cursor: String!
  }

  type SquadApplicationConnection {
    edges: [SquadApplicationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SquadApplicationEdge {
    node: SquadApplication!
    cursor: String!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  extend type Query {
    # Squads
    squad(id: ID!): Squad
    squadBySlug(slug: String!): Squad
    squads(
      filter: SquadFilterInput
      pagination: PaginationInput
    ): SquadConnection!
    
    featuredSquads(limit: Int): [Squad!]!
    verifiedSquads(pagination: PaginationInput): SquadConnection!
    
    # My Squads
    mySquads: [Squad!]!
    squadILead: Squad
    
    # Applications
    mySquadApplications(
      status: SquadApplicationStatus
    ): [SquadApplication!]!
    
    squadApplications(
      squadId: ID!
      status: SquadApplicationStatus
      pagination: PaginationInput
    ): SquadApplicationConnection!
    
    # Invitations
    mySquadInvitations(
      status: SquadApplicationStatus
    ): [SquadInvitation!]!
    
    # Search
    searchSquads(
      query: String!
      filter: SquadFilterInput
      pagination: PaginationInput
    ): SquadConnection!
    
    # Check
    checkSlugAvailability(slug: String!): Boolean!
  }

  # ==========================================
  # MUTATIONS
  # ==========================================

  extend type Mutation {
    # Squad CRUD
    createSquad(input: CreateSquadInput!): Squad!
    updateSquad(id: ID!, input: UpdateSquadInput!): Squad!
    disbandSquad(id: ID!, reason: String): MessageResponse!
    
    # Squad Actions
    activateSquad(id: ID!): Squad!
    deactivateSquad(id: ID!): Squad!
    
    # Applications
    applyToSquad(input: SquadApplicationInput!): SquadApplication!
    withdrawApplication(applicationId: ID!): MessageResponse!
    acceptApplication(applicationId: ID!): SquadMember!
    rejectApplication(applicationId: ID!, reason: String): SquadApplication!
    
    # Invitations
    inviteMember(input: InviteMemberInput!): SquadInvitation!
    cancelInvitation(invitationId: ID!): MessageResponse!
    acceptInvitation(invitationId: ID!): SquadMember!
    declineInvitation(invitationId: ID!): MessageResponse!
    
    # Member Management
    removeMember(squadId: ID!, memberId: ID!, reason: String): MessageResponse!
    promoteMember(squadId: ID!, memberId: ID!, role: SquadMemberRole!): SquadMember!
    updateMemberTitle(squadId: ID!, memberId: ID!, title: String!): SquadMember!
    leaveSquad(squadId: ID!): MessageResponse!
    transferLeadership(squadId: ID!, newLeaderId: ID!): Squad!
    
    # Projects/Portfolio
    addSquadProject(
      squadId: ID!
      title: String!
      description: String!
      client: String
      techStack: [String!]!
      images: [String!]
      projectUrl: String
      completedAt: DateTime!
    ): SquadProject!
    
    updateSquadProject(
      projectId: ID!
      title: String
      description: String
      client: String
      techStack: [String!]
      images: [String!]
      projectUrl: String
    ): SquadProject!
    
    removeSquadProject(projectId: ID!): MessageResponse!
  }

  # ==========================================
  # SUBSCRIPTIONS
  # ==========================================

  extend type Subscription {
    squadUpdated(squadId: ID!): Squad!
    newApplication(squadId: ID!): SquadApplication!
    applicationStatusChanged(applicantId: ID!): SquadApplication!
    memberJoined(squadId: ID!): SquadMember!
    memberLeft(squadId: ID!): SquadMember!
    invitationReceived(userId: ID!): SquadInvitation!
  }
`;

export default squadTypeDef;