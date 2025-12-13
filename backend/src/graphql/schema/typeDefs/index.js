// apps/backend/src/graphql/schema/typeDefs/index.js

import { mergeTypeDefs } from '@graphql-tools/merge';

// Core Type Definitions
import userTypeDef from './user.typeDef.js';
import solutionTypeDef from './solution.typeDef.js';
import jobTypeDef from './job.typeDef.js';
import marketplaceTypeDef from './marketplace.typeDef.js';
import chatTypeDef from './chat.typeDef.js';
import squadTypeDef from './squad.typeDef.js';
import subscriptionTypeDef from './subscription.typeDef.js';
import paymentTypeDef from './payment.typeDef.js';
import notificationTypeDef from './notification.typeDef.js';
import advertisementTypeDef from './advertisement.typeDef.js';
import analyticsTypeDef from './analytics.typeDef.js';

// Admin Type Definitions
import superAdminTypeDef from './admin/superAdmin.typeDef.js';
import userManagementTypeDef from './admin/userManagement.typeDef.js';
import solutionManagementTypeDef from './admin/solutionManagement.typeDef.js';
import jobManagementTypeDef from './admin/jobManagement.typeDef.js';
import marketplaceManagementTypeDef from './admin/marketplaceManagement.typeDef.js';
import chatManagementTypeDef from './admin/chatManagement.typeDef.js';
import verificationManagementTypeDef from './admin/verificationManagement.typeDef.js';
import subscriptionManagementTypeDef from './admin/subscriptionManagement.typeDef.js';
import emailManagementTypeDef from './admin/emailManagement.typeDef.js';
import advertisingManagementTypeDef from './admin/advertisingManagement.typeDef.js';
import analyticsManagementTypeDef from './admin/analyticsManagement.typeDef.js';
import securityManagementTypeDef from './admin/securityManagement.typeDef.js';

import { gql } from 'apollo-server-express';

// ============================================
// BASE TYPE DEFINITIONS
// ============================================

const baseTypeDef = gql`
  # ============================================
  # SCALARS
  # ============================================
  
  scalar DateTime
  scalar JSON
  scalar Upload

  # ============================================
  # COMMON ENUMS
  # ============================================

  enum SortOrder {
    ASC
    DESC
  }

  enum SubscriptionTier {
    FREE
    BASE
    MID
    TOP
  }

  enum AdminRole {
    SUPER_ADMIN
    USER_ADMIN
    SOLUTION_ADMIN
    JOB_ADMIN
    MARKETPLACE_ADMIN
    CHAT_ADMIN
    VERIFICATION_ADMIN
    SUBSCRIPTION_ADMIN
    EMAIL_ADMIN
    ADVERTISING_ADMIN
    ANALYTICS_ADMIN
    SECURITY_ADMIN
  }

  # ============================================
  # COMMON TYPES
  # ============================================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
    totalCount: Int!
  }

  type OperationResult {
    success: Boolean!
    message: String
    code: String
  }

  type DeleteResult {
    success: Boolean!
    deletedCount: Int!
    message: String
  }

  type BulkOperationResult {
    success: Boolean!
    processedCount: Int!
    failedCount: Int!
    errors: [BulkOperationError!]
  }

  type BulkOperationError {
    id: ID!
    error: String!
  }

  type Admin {
    id: ID!
    user: User!
    role: AdminRole!
    permissions: [String!]!
    isActive: Boolean!
    lastActiveAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type GeoLocation {
    country: String
    countryCode: String
    city: String
    region: String
    latitude: Float
    longitude: Float
    timezone: String
  }

  type Address {
    street: String
    city: String
    state: String
    country: String!
    countryCode: String
    postalCode: String
  }

  type MoneyAmount {
    amount: Int!
    currency: String!
    formatted: String
  }

  type DateRange {
    from: DateTime!
    to: DateTime!
  }

  # ============================================
  # INPUT TYPES
  # ============================================

  input PaginationInput {
    page: Int
    limit: Int
  }

  input DateRangeInput {
    from: DateTime!
    to: DateTime!
  }

  input GeoLocationInput {
    country: String
    countryCode: String
    city: String
    region: String
    latitude: Float
    longitude: Float
  }

  input AddressInput {
    street: String
    city: String
    state: String
    country: String!
    countryCode: String
    postalCode: String
  }

  # ============================================
  # DIRECTIVES
  # ============================================

  directive @auth(requires: [AdminRole!]) on FIELD_DEFINITION
  directive @rateLimit(max: Int!, window: Int!) on FIELD_DEFINITION
  directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE

  # ============================================
  # ROOT TYPES
  # ============================================

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

// ============================================
// MERGE ALL TYPE DEFINITIONS
// ============================================

const typeDefs = mergeTypeDefs([
  // Base
  baseTypeDef,
  
  // Core Features
  userTypeDef,
  solutionTypeDef,
  jobTypeDef,
  marketplaceTypeDef,
  chatTypeDef,
  squadTypeDef,
  subscriptionTypeDef,
  paymentTypeDef,
  notificationTypeDef,
  advertisementTypeDef,
  analyticsTypeDef,
  
  // Admin Features
  superAdminTypeDef,
  userManagementTypeDef,
  solutionManagementTypeDef,
  jobManagementTypeDef,
  marketplaceManagementTypeDef,
  chatManagementTypeDef,
  verificationManagementTypeDef,
  subscriptionManagementTypeDef,
  emailManagementTypeDef,
  advertisingManagementTypeDef,
  analyticsManagementTypeDef,
  securityManagementTypeDef,
]);

export default typeDefs;

// Named exports for individual use
export {
  baseTypeDef,
  userTypeDef,
  solutionTypeDef,
  jobTypeDef,
  marketplaceTypeDef,
  chatTypeDef,
  squadTypeDef,
  subscriptionTypeDef,
  paymentTypeDef,
  notificationTypeDef,
  advertisementTypeDef,
  analyticsTypeDef,
  superAdminTypeDef,
  userManagementTypeDef,
  solutionManagementTypeDef,
  jobManagementTypeDef,
  marketplaceManagementTypeDef,
  chatManagementTypeDef,
  verificationManagementTypeDef,
  subscriptionManagementTypeDef,
  emailManagementTypeDef,
  advertisingManagementTypeDef,
  analyticsManagementTypeDef,
  securityManagementTypeDef,
};