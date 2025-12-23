import { mergeResolvers } from '@graphql-tools/merge';

// Import all resolvers
import solutionResolvers from './solution.resolver.js';
import solutionManagementResolvers from './admin/solutionManagement.resolver.js';

// Import other resolvers (they would be created similarly)
import userResolvers from './user.resolver.js';
import authResolvers from './auth.resolver.js';

// Merge all resolvers
const resolvers = mergeResolvers([
  solutionResolvers,
  solutionManagementResolvers,
  userResolvers,
  authResolvers
  // Add other resolvers here
]);

export default resolvers;