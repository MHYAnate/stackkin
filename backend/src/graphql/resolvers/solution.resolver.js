import { AuthenticationError, ValidationError, ForbiddenError } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import { solutionService, ratingService, complaintService, categoryService } from '../../services/solution/index.js';
import { paymentService } from '../../services/payment/index.js';
import logger from '../../config/logger.js';

const pubsub = new PubSub();

export const solutionResolvers = {
  // Type Resolvers
  Solution: {
    author: async (parent, args, context) => {
      try {
        if (parent.author && typeof parent.author === 'object') {
          return parent.author;
        }
        
        if (context.loaders?.userLoader) {
          return context.loaders.userLoader.load(parent.author);
        }
        
        // Fallback to database query
        const User = (await import('../../models/User.js')).default;
        return User.findById(parent.author).select('firstName lastName username avatar email');
      } catch (error) {
        logger.error('Solution author resolver error:', error);
        return null;
      }
    },
    
    category: async (parent, args, context) => {
      try {
        if (parent.category && typeof parent.category === 'object') {
          return parent.category;
        }
        
        return categoryService.getCategoryById(parent.category);
      } catch (error) {
        logger.error('Solution category resolver error:', error);
        return null;
      }
    },
    
    ratings: async (parent, args, context) => {
      try {
        if (parent.ratings && Array.isArray(parent.ratings)) {
          return parent.ratings;
        }
        
        const Rating = (await import('../../models/Rating.js')).default;
        return Rating.find({ solution: parent._id })
          .populate('user', 'firstName lastName username avatar')
          .sort({ createdAt: -1 })
          .limit(20);
      } catch (error) {
        logger.error('Solution ratings resolver error:', error);
        return [];
      }
    },
    
    complaints: async (parent, args, context) => {
      try {
        if (parent.complaints && Array.isArray(parent.complaints)) {
          return parent.complaints;
        }
        
        const Complaint = (await import('../../models/Complaint.js')).default;
        return Complaint.find({ solution: parent._id, status: { $ne: 'RESOLVED' } })
          .populate('reporter', 'firstName lastName username')
          .sort({ createdAt: -1 });
      } catch (error) {
        logger.error('Solution complaints resolver error:', error);
        return [];
      }
    }
  },
  
  Category: {
    parentCategory: async (parent, args, context) => {
      try {
        if (!parent.parentCategory) return null;
        
        if (parent.parentCategory && typeof parent.parentCategory === 'object') {
          return parent.parentCategory;
        }
        
        return categoryService.getCategoryById(parent.parentCategory);
      } catch (error) {
        logger.error('Category parent resolver error:', error);
        return null;
      }
    },
    
    subCategories: async (parent, args, context) => {
      try {
        if (parent.subCategories && Array.isArray(parent.subCategories)) {
          return parent.subCategories;
        }
        
        return categoryService.getCategories(parent._id);
      } catch (error) {
        logger.error('Category subcategories resolver error:', error);
        return [];
      }
    },
    
    solutions: async (parent, args, context) => {
      try {
        const Solution = (await import('../../models/Solution.js')).default;
        return Solution.find({
          category: parent._id,
          status: 'PUBLISHED',
          visibility: 'PUBLIC'
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'firstName lastName username avatar');
      } catch (error) {
        logger.error('Category solutions resolver error:', error);
        return [];
      }
    }
  },
  
  Rating: {
    solution: async (parent, args, context) => {
      try {
        if (parent.solution && typeof parent.solution === 'object') {
          return parent.solution;
        }
        
        if (context.loaders?.solutionLoader) {
          return context.loaders.solutionLoader.load(parent.solution);
        }
        
        return solutionService.getSolutionById(parent.solution);
      } catch (error) {
        logger.error('Rating solution resolver error:', error);
        return null;
      }
    },
    
    user: async (parent, args, context) => {
      try {
        if (parent.user && typeof parent.user === 'object') {
          return parent.user;
        }
        
        if (context.loaders?.userLoader) {
          return context.loaders.userLoader.load(parent.user);
        }
        
        const User = (await import('../../models/User.js')).default;
        return User.findById(parent.user).select('firstName lastName username avatar');
      } catch (error) {
        logger.error('Rating user resolver error:', error);
        return null;
      }
    }
  },
  
  Complaint: {
    solution: async (parent, args, context) => {
      try {
        if (parent.solution && typeof parent.solution === 'object') {
          return parent.solution;
        }
        
        return solutionService.getSolutionById(parent.solution);
      } catch (error) {
        logger.error('Complaint solution resolver error:', error);
        return null;
      }
    },
    
    reporter: async (parent, args, context) => {
      try {
        if (parent.reporter && typeof parent.reporter === 'object') {
          return parent.reporter;
        }
        
        const User = (await import('../../models/User.js')).default;
        return User.findById(parent.reporter).select('firstName lastName username');
      } catch (error) {
        logger.error('Complaint reporter resolver error:', error);
        return null;
      }
    },
    
    resolvedBy: async (parent, args, context) => {
      try {
        if (!parent.resolvedBy) return null;
        
        if (parent.resolvedBy && typeof parent.resolvedBy === 'object') {
          return parent.resolvedBy;
        }
        
        const User = (await import('../../models/User.js')).default;
        return User.findById(parent.resolvedBy).select('firstName lastName username');
      } catch (error) {
        logger.error('Complaint resolvedBy resolver error:', error);
        return null;
      }
    }
  },
  
  // Query Resolvers
  Query: {
    solution: async (_, { id }, context) => {
      try {
        return solutionService.getSolutionById(id, context.user?._id);
      } catch (error) {
        logger.error('Get solution query error:', error);
        throw error;
      }
    },
    
    solutionBySlug: async (_, { slug }, context) => {
      try {
        return solutionService.getSolutionBySlug(slug, context.user?._id);
      } catch (error) {
        logger.error('Get solution by slug query error:', error);
        throw error;
      }
    },
    
    solutions: async (_, { filter = {}, pagination = {} }, context) => {
      try {
        const result = await solutionService.getSolutions(filter, pagination, context.user?._id);
        
        return {
          edges: result.solutions.map(solution => ({
            node: solution,
            cursor: solution._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.solutions[0]?._id.toString(),
            endCursor: result.solutions[result.solutions.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Get solutions query error:', error);
        throw error;
      }
    },
    
    mySolutions: async (_, { filter = {}, pagination = {} }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to view your solutions');
        }
        
        const result = await solutionService.getUserSolutions(context.user._id, filter, pagination);
        
        return {
          edges: result.solutions.map(solution => ({
            node: solution,
            cursor: solution._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.solutions[0]?._id.toString(),
            endCursor: result.solutions[result.solutions.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Get my solutions query error:', error);
        throw error;
      }
    },
    
    featuredSolutions: async (_, { limit = 10 }, context) => {
      try {
        return solutionService.getFeaturedSolutions(limit);
      } catch (error) {
        logger.error('Get featured solutions query error:', error);
        throw error;
      }
    },
    
    topSolutions: async (_, { categoryId = null, limit = 10 }, context) => {
      try {
        return solutionService.getTopSolutions(categoryId, limit);
      } catch (error) {
        logger.error('Get top solutions query error:', error);
        throw error;
      }
    },
    
    premiumSolutions: async (_, { categoryId = null, pagination = {} }, context) => {
      try {
        const result = await solutionService.getPremiumSolutions(categoryId, pagination);
        
        return {
          edges: result.solutions.map(solution => ({
            node: solution,
            cursor: solution._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.solutions[0]?._id.toString(),
            endCursor: result.solutions[result.solutions.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Get premium solutions query error:', error);
        throw error;
      }
    },
    
    categories: async (_, { parentId }, context) => {
      try {
        return categoryService.getCategories(parentId);
      } catch (error) {
        logger.error('Get categories query error:', error);
        throw error;
      }
    },
    
    category: async (_, { id }, context) => {
      try {
        return categoryService.getCategoryById(id);
      } catch (error) {
        logger.error('Get category query error:', error);
        throw error;
      }
    },
    
    categoryBySlug: async (_, { slug }, context) => {
      try {
        return categoryService.getCategoryBySlug(slug);
      } catch (error) {
        logger.error('Get category by slug query error:', error);
        throw error;
      }
    },
    
    solutionRatings: async (_, { solutionId, pagination = {} }, context) => {
      try {
        const result = await ratingService.getSolutionRatings(solutionId, pagination);
        
        return {
          edges: result.ratings.map(rating => ({
            node: rating,
            cursor: rating._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.ratings[0]?._id.toString(),
            endCursor: result.ratings[result.ratings.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Get solution ratings query error:', error);
        throw error;
      }
    },
    
    myRatings: async (_, { pagination = {} }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to view your ratings');
        }
        
        const result = await ratingService.getUserRatings(context.user._id, pagination);
        
        return {
          edges: result.ratings.map(rating => ({
            node: rating,
            cursor: rating._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.ratings[0]?._id.toString(),
            endCursor: result.ratings[result.ratings.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Get my ratings query error:', error);
        throw error;
      }
    },
    
    searchSolutions: async (_, { query, filter = {}, pagination = {} }, context) => {
      try {
        const result = await solutionService.searchSolutions(query, filter, pagination);
        
        return {
          edges: result.solutions.map(solution => ({
            node: solution,
            cursor: solution._id.toString()
          })),
          pageInfo: {
            hasNextPage: result.pagination.hasNextPage,
            hasPrevPage: result.pagination.hasPrevPage,
            startCursor: result.solutions[0]?._id.toString(),
            endCursor: result.solutions[result.solutions.length - 1]?._id.toString()
          },
          totalCount: result.pagination.totalCount
        };
      } catch (error) {
        logger.error('Search solutions query error:', error);
        throw error;
      }
    },
    
    suggestedSolutions: async (_, { solutionId, limit = 5 }, context) => {
      try {
        return solutionService.getSuggestedSolutions(solutionId, limit);
      } catch (error) {
        logger.error('Get suggested solutions query error:', error);
        throw error;
      }
    },
    
    trendingTags: async (_, { limit = 10 }, context) => {
      try {
        return solutionService.getTrendingTags(limit);
      } catch (error) {
        logger.error('Get trending tags query error:', error);
        throw error;
      }
    },
    
    solutionStats: async (_, { solutionId }, context) => {
      try {
        return solutionService.getSolutionStats(solutionId);
      } catch (error) {
        logger.error('Get solution stats query error:', error);
        throw error;
      }
    },
    
    categoryStats: async (_, { categoryId }, context) => {
      try {
        return solutionService.getCategoryStats(categoryId);
      } catch (error) {
        logger.error('Get category stats query error:', error);
        throw error;
      }
    }
  },
  
  // Mutation Resolvers
  Mutation: {
    createSolution: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to create a solution');
        }
        
        const solution = await solutionService.createSolution(input, context.user._id);
        
        // Publish subscription event
        await pubsub.publish('SOLUTION_CREATED', {
          solutionCreated: solution,
          categoryId: solution.category
        });
        
        return solution;
      } catch (error) {
        logger.error('Create solution mutation error:', error);
        throw error;
      }
    },
    
    updateSolution: async (_, { id, input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to update a solution');
        }
        
        const solution = await solutionService.updateSolution(
          id, 
          input, 
          context.user._id, 
          context.user.role
        );
        
        // Publish subscription event
        await pubsub.publish('SOLUTION_UPDATED', {
          solutionUpdated: solution
        });
        
        return solution;
      } catch (error) {
        logger.error('Update solution mutation error:', error);
        throw error;
      }
    },
    
    deleteSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to delete a solution');
        }
        
        const result = await solutionService.deleteSolution(
          id, 
          context.user._id, 
          context.user.role,
          'Deleted by user'
        );
        
        return {
          success: result.deleted,
          message: result.message
        };
      } catch (error) {
        logger.error('Delete solution mutation error:', error);
        throw error;
      }
    },
    
    publishSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to publish a solution');
        }
        
        const solution = await solutionService.publishSolution(
          id, 
          context.user._id, 
          context.user.role
        );
        
        return solution;
      } catch (error) {
        logger.error('Publish solution mutation error:', error);
        throw error;
      }
    },
    
    unpublishSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to unpublish a solution');
        }
        
        const solution = await solutionService.updateSolution(
          id, 
          { status: 'DRAFT' }, 
          context.user._id, 
          context.user.role
        );
        
        return solution;
      } catch (error) {
        logger.error('Unpublish solution mutation error:', error);
        throw error;
      }
    },
    
    archiveSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to archive a solution');
        }
        
        const solution = await solutionService.archiveSolution(
          id, 
          context.user._id, 
          context.user.role
        );
        
        return solution;
      } catch (error) {
        logger.error('Archive solution mutation error:', error);
        throw error;
      }
    },
    
    upgradeToPremium: async (_, { solutionId }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to upgrade a solution');
        }
        
        // Check if user is solution owner or admin
        const solution = await solutionService.getSolutionById(solutionId);
        if (!solution.isOwner(context.user._id) && context.user.role !== 'ADMIN') {
          throw new ForbiddenError('Only the solution owner or admin can upgrade to premium');
        }
        
        // Process payment and upgrade
        const result = await solutionService.upgradeToPremium(solutionId);
        
        // In production, you would integrate with Zainpay here
        // For now, we'll use the mock implementation
        
        return result;
      } catch (error) {
        logger.error('Upgrade to premium mutation error:', error);
        throw error;
      }
    },
    
    viewSolution: async (_, { id }, context) => {
      try {
        const solution = await solutionService.incrementViews(id);
        return solution;
      } catch (error) {
        logger.error('View solution mutation error:', error);
        throw error;
      }
    },
    
    saveSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to save a solution');
        }
        
        const result = await solutionService.toggleSave(id, context.user._id);
        
        return {
          success: true,
          message: result.message
        };
      } catch (error) {
        logger.error('Save solution mutation error:', error);
        throw error;
      }
    },
    
    unsaveSolution: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to unsave a solution');
        }
        
        const result = await solutionService.toggleSave(id, context.user._id);
        
        return {
          success: true,
          message: result.message
        };
      } catch (error) {
        logger.error('Unsave solution mutation error:', error);
        throw error;
      }
    },
    
    shareSolution: async (_, { id, platform }, context) => {
      try {
        const solution = await solutionService.shareSolution(id, platform);
        
        return {
          success: true,
          message: `Solution shared${platform ? ` on ${platform}` : ''}`
        };
      } catch (error) {
        logger.error('Share solution mutation error:', error);
        throw error;
      }
    },
    
    rateSolution: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to rate a solution');
        }
        
        const rating = await ratingService.createRating(input, context.user._id);
        
        // Publish subscription event
        await pubsub.publish('NEW_RATING', {
          newRating: rating,
          solutionId: rating.solution
        });
        
        // Also publish solution rated event
        await pubsub.publish('SOLUTION_RATED', {
          solutionRated: await solutionService.getSolutionById(rating.solution)
        });
        
        return rating;
      } catch (error) {
        logger.error('Rate solution mutation error:', error);
        throw error;
      }
    },
    
    updateRating: async (_, { id, input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to update a rating');
        }
        
        const rating = await ratingService.updateRating(
          id, 
          input, 
          context.user._id, 
          context.user.role
        );
        
        return rating;
      } catch (error) {
        logger.error('Update rating mutation error:', error);
        throw error;
      }
    },
    
    deleteRating: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to delete a rating');
        }
        
        const result = await ratingService.deleteRating(
          id, 
          context.user._id, 
          context.user.role
        );
        
        return {
          success: result.deleted,
          message: result.message
        };
      } catch (error) {
        logger.error('Delete rating mutation error:', error);
        throw error;
      }
    },
    
    markRatingHelpful: async (_, { id }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to mark a rating helpful');
        }
        
        const rating = await ratingService.markRatingHelpful(id, context.user._id);
        return rating;
      } catch (error) {
        logger.error('Mark rating helpful mutation error:', error);
        throw error;
      }
    },
    
    reportRating: async (_, { id, reason }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to report a rating');
        }
        
        const result = await ratingService.reportRating(id, reason, context.user._id);
        
        return {
          success: result.reported,
          message: result.message
        };
      } catch (error) {
        logger.error('Report rating mutation error:', error);
        throw error;
      }
    },
    
    respondToRating: async (_, { ratingId, response }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to respond to a rating');
        }
        
        const rating = await ratingService.respondToRating(ratingId, response, context.user._id);
        return rating;
      } catch (error) {
        logger.error('Respond to rating mutation error:', error);
        throw error;
      }
    },
    
    submitComplaint: async (_, { input }, context) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to submit a complaint');
        }
        
        const complaint = await complaintService.submitComplaint(input, context.user._id);
        return complaint;
      } catch (error) {
        logger.error('Submit complaint mutation error:', error);
        throw error;
      }
    },
    
    createCategory: async (_, args, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to create categories');
        }
        
        const category = await categoryService.createCategory({
          name: args.name,
          slug: args.slug,
          description: args.description,
          icon: args.icon,
          color: args.color,
          parentId: args.parentId,
          order: args.order || 0
        });
        
        return category;
      } catch (error) {
        logger.error('Create category mutation error:', error);
        throw error;
      }
    },
    
    updateCategory: async (_, args, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to update categories');
        }
        
        const updateData = {};
        if (args.name !== undefined) updateData.name = args.name;
        if (args.slug !== undefined) updateData.slug = args.slug;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.icon !== undefined) updateData.icon = args.icon;
        if (args.color !== undefined) updateData.color = args.color;
        if (args.parentId !== undefined) updateData.parentCategory = args.parentId;
        if (args.order !== undefined) updateData.order = args.order;
        if (args.isActive !== undefined) updateData.isActive = args.isActive;
        
        const category = await categoryService.updateCategory(args.id, updateData);
        return category;
      } catch (error) {
        logger.error('Update category mutation error:', error);
        throw error;
      }
    },
    
    deleteCategory: async (_, { id }, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to delete categories');
        }
        
        const result = await categoryService.deleteCategory(id);
        
        return {
          success: result.deleted,
          message: result.message
        };
      } catch (error) {
        logger.error('Delete category mutation error:', error);
        throw error;
      }
    }
  },
  
  // Subscription Resolvers
  Subscription: {
    solutionCreated: {
      subscribe: (_, { categoryId }, context) => {
        // Check authentication
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to subscribe to solution updates');
        }
        
        // If categoryId is provided, only listen to solutions in that category
        const channel = categoryId 
          ? `SOLUTION_CREATED_CATEGORY_${categoryId}`
          : 'SOLUTION_CREATED';
        
        return pubsub.asyncIterator([channel]);
      }
    },
    
    solutionUpdated: {
      subscribe: (_, { id }, context) => {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to subscribe to solution updates');
        }
        
        // If id is provided, only listen to updates for that specific solution
        const channel = id 
          ? `SOLUTION_UPDATED_${id}`
          : 'SOLUTION_UPDATED';
        
        return pubsub.asyncIterator([channel]);
      }
    },
    
    newRating: {
      subscribe: (_, { solutionId }, context) => {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to subscribe to rating updates');
        }
        
        const channel = solutionId 
          ? `NEW_RATING_${solutionId}`
          : 'NEW_RATING';
        
        return pubsub.asyncIterator([channel]);
      }
    },
    
    topSolutionsUpdated: {
      subscribe: (_, { categoryId }, context) => {
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to subscribe to top solutions updates');
        }
        
        const channel = categoryId 
          ? `TOP_SOLUTIONS_CATEGORY_${categoryId}`
          : 'TOP_SOLUTIONS';
        
        return pubsub.asyncIterator([channel]);
      }
    }
  }
};

export default solutionResolvers;