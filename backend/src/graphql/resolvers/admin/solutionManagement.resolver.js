import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { solutionService, categoryService } from '../../../services/solution/index.js';
import { userService } from '../../../services/user/index.js';
import logger from '../../../config/logger.js';

export const solutionManagementResolvers = {
  // Type Resolvers
  SolutionManagementStats: {
    byCategory: async (parent, args, context) => {
      try {
        const Category = (await import('../../../models/Category.js')).default;
        const categories = await Category.find({ isActive: true }).lean();
        
        const categoryStats = await Promise.all(
          categories.map(async category => {
            const stats = await solutionService.getCategoryStats(category._id);
            return {
              category: category.name,
              totalSolutions: stats.totalSolutions,
              newSolutions: 0, // Would need tracking of new solutions
              averageRating: stats.averageRating,
              totalViews: stats.totalViews,
              premiumCount: stats.premiumCount,
              featuredCount: stats.featuredCount
            };
          })
        );
        
        return categoryStats;
      } catch (error) {
        logger.error('Solution management stats byCategory resolver error:', error);
        return [];
      }
    },
    
    byContentType: async (parent, args, context) => {
      try {
        const Solution = (await import('../../../models/Solution.js')).default;
        
        const contentTypeStats = await Solution.aggregate([
          {
            $group: {
              _id: '$type',
              totalSolutions: { $sum: 1 },
              averageRating: { $avg: '$averageRating' },
              totalDownloads: { $sum: { $ifNull: ['$downloads', 0] } },
              revenue: { $sum: { $ifNull: ['$price', 0] } }
            }
          },
          {
            $project: {
              type: '$_id',
              totalSolutions: 1,
              averageRating: { $round: ['$averageRating', 2] },
              totalDownloads: 1,
              revenue: 1,
              growthRate: 0, // Would need historical data
              _id: 0
            }
          }
        ]);
        
        return contentTypeStats;
      } catch (error) {
        logger.error('Solution management stats byContentType resolver error:', error);
        return [];
      }
    }
  },
  
  SolutionDetail: {
    moderationHistory: async (parent, args, context) => {
      try {
        // In a real app, you'd have a SolutionModerationLog model
        // For now, return empty array
        return [];
      } catch (error) {
        logger.error('Solution detail moderationHistory resolver error:', error);
        return [];
      }
    },
    
    reports: async (parent, args, context) => {
      try {
        const Complaint = (await import('../../../models/Complaint.js')).default;
        return Complaint.find({ solution: parent.solution._id })
          .populate('reporter', 'firstName lastName username')
          .populate('resolvedBy', 'firstName lastName username')
          .sort({ createdAt: -1 });
      } catch (error) {
        logger.error('Solution detail reports resolver error:', error);
        return [];
      }
    },
    
    adminNotes: async (parent, args, context) => {
      try {
        // In a real app, you'd have an AdminNote model
        // For now, return empty array
        return [];
      } catch (error) {
        logger.error('Solution detail adminNotes resolver error:', error);
        return [];
      }
    },
    
    featuredHistory: async (parent, args, context) => {
      try {
        // In a real app, you'd have a FeaturedRecord model
        // For now, return empty array
        return [];
      } catch (error) {
        logger.error('Solution detail featuredHistory resolver error:', error);
        return [];
      }
    },
    
    analytics: async (parent, args, context) => {
      try {
        const stats = await solutionService.getSolutionStats(parent.solution._id);
        
        return {
          totalViews: stats.totalViews,
          uniqueViews: stats.uniqueViews,
          viewsToday: 0, // Would need daily tracking
          viewsThisWeek: 0,
          viewsThisMonth: 0,
          timeSpent: 0,
          bounceRate: 0,
          scrollDepth: 0,
          likes: 0,
          shares: stats.totalShares,
          bookmarks: stats.totalSaves,
          downloads: 0,
          premiumUpgrades: 0,
          relatedPurchases: 0,
          affiliateClicks: 0,
          ratingCount: stats.totalRatings,
          commentCount: 0,
          reportCount: parent.solution.complaintsCount || 0,
          loadTime: 0,
          errorRate: 0,
          satisfactionScore: stats.averageRating * 20 // Convert 5-star to percentage
        };
      } catch (error) {
        logger.error('Solution detail analytics resolver error:', error);
        return null;
      }
    },
    
    engagement: async (parent, args, context) => {
      try {
        // Mock engagement metrics
        return {
          returningVisitors: Math.floor((parent.solution.views || 0) * 0.3),
          sessionDuration: 180, // 3 minutes average
          pagesPerSession: 1.5,
          socialShares: parent.solution.shares || 0,
          referralTraffic: 0,
          backlinks: 0,
          completionRate: 75,
          interactionRate: 25,
          feedbackRate: 10,
          discussions: 0,
          collaborations: 0,
          forks: 0
        };
      } catch (error) {
        logger.error('Solution detail engagement resolver error:', error);
        return null;
      }
    },
    
    quality: async (parent, args, context) => {
      try {
        const solution = parent.solution;
        
        // Calculate quality metrics based on solution data
        const qualityScore = solution.averageRating * 20; // Convert to percentage
        const trustScore = solution.ratingsCount >= 10 ? 90 : 50; // Based on number of ratings
        
        return {
          codeQuality: qualityScore * 0.9,
          documentation: 80,
          performance: 85,
          security: 75,
          accuracy: 90,
          completeness: 80,
          originality: 95,
          relevance: 85,
          helpfulness: qualityScore,
          clarity: 75,
          organization: 80,
          qualityScore: qualityScore,
          trustScore: trustScore,
          recommendationScore: Math.min(100, qualityScore * 1.1)
        };
      } catch (error) {
        logger.error('Solution detail quality resolver error:', error);
        return null;
      }
    },
    
    relatedSolutions: async (parent, args, context) => {
      try {
        return solutionService.getSuggestedSolutions(parent.solution._id, 5);
      } catch (error) {
        logger.error('Solution detail relatedSolutions resolver error:', error);
        return [];
      }
    },
    
    similarSolutions: async (parent, args, context) => {
      try {
        const Solution = (await import('../../../models/Solution.js')).default;
        
        return Solution.find({
          _id: { $ne: parent.solution._id },
          category: parent.solution.category,
          status: 'PUBLISHED',
          $or: [
            { tags: { $in: parent.solution.tags || [] } },
            { techStack: { $in: parent.solution.techStack || [] } }
          ]
        })
        .limit(5)
        .populate('author', 'firstName lastName username avatar')
        .populate('category', 'name slug');
      } catch (error) {
        logger.error('Solution detail similarSolutions resolver error:', error);
        return [];
      }
    },
    
    userSolutions: async (parent, args, context) => {
      try {
        const Solution = (await import('../../../models/Solution.js')).default;
        
        return Solution.find({
          author: parent.solution.author,
          _id: { $ne: parent.solution._id },
          status: 'PUBLISHED'
        })
        .limit(5)
        .populate('category', 'name slug');
      } catch (error) {
        logger.error('Solution detail userSolutions resolver error:', error);
        return [];
      }
    },
    
    riskScore: async (parent, args, context) => {
      try {
        const solution = parent.solution;
        let riskScore = 0;
        
        // Calculate risk based on various factors
        if (solution.complaintsCount > 0) riskScore += 20;
        if (solution.averageRating < 3) riskScore += 30;
        if (solution.ratingsCount < 5) riskScore += 15;
        if (!solution.contactEmail) riskScore += 10;
        if (!solution.images || solution.images.length === 0) riskScore += 5;
        
        return Math.min(100, riskScore);
      } catch (error) {
        logger.error('Solution detail riskScore resolver error:', error);
        return 0;
      }
    },
    
    riskFactors: async (parent, args, context) => {
      try {
        const solution = parent.solution;
        const factors = [];
        
        if (solution.complaintsCount > 0) {
          factors.push({
            factor: 'User Complaints',
            severity: 'HIGH',
            description: `${solution.complaintsCount} complaints reported`
          });
        }
        
        if (solution.averageRating < 3) {
          factors.push({
            factor: 'Low Rating',
            severity: 'MEDIUM',
            description: `Average rating is ${solution.averageRating}/5`
          });
        }
        
        if (solution.ratingsCount < 5) {
          factors.push({
            factor: 'Limited Reviews',
            severity: 'LOW',
            description: `Only ${solution.ratingsCount} ratings received`
          });
        }
        
        if (!solution.contactEmail) {
          factors.push({
            factor: 'Missing Contact Information',
            severity: 'MEDIUM',
            description: 'No contact email provided'
          });
        }
        
        if (!solution.images || solution.images.length === 0) {
          factors.push({
            factor: 'No Images',
            severity: 'LOW',
            description: 'Solution has no images'
          });
        }
        
        return factors;
      } catch (error) {
        logger.error('Solution detail riskFactors resolver error:', error);
        return [];
      }
    }
  },
  
  // Query Resolvers
  Query: {
    solutionManagementStats: async (_, args, context) => {
      try {
        // Check admin permissions
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to view solution management stats');
        }
        
        const Solution = (await import('../../../models/Solution.js')).default;
        
        const [
          totalSolutions,
          newSolutionsToday,
          newSolutionsThisWeek,
          newSolutionsThisMonth,
          draftSolutions,
          pendingReview,
          approvedSolutions,
          rejectedSolutions,
          suspendedSolutions,
          archivedSolutions,
          premiumSolutions,
          featuredSolutions,
          pinnedSolutions,
          totalReports,
          pendingReports,
          resolvedReports,
          averageRating,
          totalViews
        ] = await Promise.all([
          Solution.countDocuments(),
          Solution.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }),
          Solution.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }),
          Solution.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }),
          Solution.countDocuments({ status: 'DRAFT' }),
          Solution.countDocuments({ status: 'PENDING_REVIEW' }),
          Solution.countDocuments({ status: 'PUBLISHED' }),
          Solution.countDocuments({ status: 'REJECTED' }),
          Solution.countDocuments({ status: 'SUSPENDED' }),
          Solution.countDocuments({ status: 'ARCHIVED' }),
          Solution.countDocuments({ isPremium: true }),
          Solution.countDocuments({ isFeatured: true }),
          Solution.countDocuments({ isPinned: true }),
          Solution.aggregate([{ $group: { _id: null, total: { $sum: '$complaintsCount' } } }]),
          Solution.countDocuments({ complaintsCount: { $gt: 0 } }),
          Solution.countDocuments({ complaintsCount: 0 }),
          Solution.aggregate([{ $group: { _id: null, avg: { $avg: '$averageRating' } } }]),
          Solution.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }])
        ]);
        
        return {
          totalSolutions,
          newSolutionsToday,
          newSolutionsThisWeek,
          newSolutionsThisMonth,
          draftSolutions,
          pendingReview,
          approvedSolutions,
          rejectedSolutions,
          suspendedSolutions,
          archivedSolutions,
          premiumSolutions,
          featuredSolutions,
          pinnedSolutions,
          totalReports: totalReports[0]?.total || 0,
          pendingReports,
          resolvedReports,
          averageRating: Math.round((averageRating[0]?.avg || 0) * 10) / 10,
          totalViews: totalViews[0]?.total || 0,
          totalDownloads: 0,
          totalComments: 0,
          solutionGrowthRate: 0,
          engagementGrowthRate: 0,
          premiumAdoptionRate: 0
        };
      } catch (error) {
        logger.error('Get solution management stats query error:', error);
        throw error;
      }
    },
    
    solutionDashboard: async (_, args, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to view solution dashboard');
        }
        
        const [
          stats,
          featuredSolutions,
          topPerforming,
          trending
        ] = await Promise.all([
          solutionManagementResolvers.Query.solutionManagementStats(_, args, context),
          solutionService.getFeaturedSolutions(10),
          solutionService.getTopSolutions(null, 10),
          solutionService.getSolutions({}, { page: 1, limit: 10, sortBy: 'views', sortOrder: 'desc' })
        ]);
        
        return {
          stats,
          activeQueues: [], // Would need queue implementation
          recentModerations: [],
          recentReports: [],
          recentFeatured: [],
          topPerforming: topPerforming.map(item => ({
            solution: item.solution
          })),
          mostReported: [], // Would need to query most reported solutions
          trending: trending.solutions.map(solution => ({
            solution
          })),
          categoryPerformance: [], // Would need category performance data
          generatedAt: new Date()
        };
      } catch (error) {
        logger.error('Get solution dashboard query error:', error);
        throw error;
      }
    },
    
    solutionDetail: async (_, { solutionId }, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to view solution detail');
        }
        
        const solution = await solutionService.getSolutionById(solutionId);
        
        return {
          solution
        };
      } catch (error) {
        logger.error('Get solution detail query error:', error);
        throw error;
      }
    }
  },
  
  // Mutation Resolvers
  Mutation: {
    moderateSolution: async (_, { input }, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to moderate solutions');
        }
        
        const solution = await solutionService.getSolutionById(input.solutionId);
        
        // Apply moderation action
        let updateData = {};
        let message = '';
        
        switch (input.action) {
          case 'APPROVE':
            updateData = { status: 'PUBLISHED' };
            message = 'Solution approved';
            break;
          case 'REJECT':
            updateData = { status: 'REJECTED' };
            message = 'Solution rejected';
            break;
          case 'SUSPEND':
            updateData = { status: 'SUSPENDED' };
            message = 'Solution suspended';
            break;
          case 'UNSUSPEND':
            updateData = { status: 'PUBLISHED' };
            message = 'Solution unsuspended';
            break;
          case 'FEATURE':
            updateData = { isFeatured: true };
            message = 'Solution featured';
            break;
          case 'UNFEATURE':
            updateData = { isFeatured: false };
            message = 'Solution unfeatured';
            break;
          case 'PIN':
            updateData = { isPinned: true };
            message = 'Solution pinned';
            break;
          case 'UNPIN':
            updateData = { isPinned: false };
            message = 'Solution unpinned';
            break;
          case 'ARCHIVE':
            updateData = { status: 'ARCHIVED' };
            message = 'Solution archived';
            break;
          case 'DELETE':
            await solutionService.deleteSolution(
              input.solutionId,
              context.user._id,
              context.user.role,
              input.reason || 'Deleted by admin'
            );
            return {
              id: Date.now().toString(),
              solution,
              admin: context.user,
              action: input.action,
              reason: input.reason,
              notes: input.notes,
              changes: input.changes,
              ipAddress: context.ip,
              userAgent: context.userAgent,
              notifiedUser: input.notifyUser || false,
              notificationMessage: input.notificationMessage,
              createdAt: new Date()
            };
          default:
            throw new Error(`Unknown moderation action: ${input.action}`);
        }
        
        // Update solution
        const updatedSolution = await solutionService.updateSolution(
          input.solutionId,
          updateData,
          context.user._id,
          context.user.role
        );
        
        // Create moderation log (in a real app, you'd save to database)
        const moderationLog = {
          id: Date.now().toString(),
          solution: updatedSolution,
          admin: context.user,
          action: input.action,
          reason: input.reason,
          notes: input.notes,
          changes: input.changes,
          ipAddress: context.ip,
          userAgent: context.userAgent,
          notifiedUser: input.notifyUser || false,
          notificationMessage: input.notificationMessage,
          createdAt: new Date()
        };
        
        // Notify user if requested
        if (input.notifyUser && solution.author) {
          await userService.sendNotification(
            solution.author,
            {
              type: 'SOLUTION_MODERATED',
              title: `Solution ${input.action.toLowerCase()}`,
              message: input.notificationMessage || `Your solution "${solution.title}" has been ${input.action.toLowerCase()}${input.reason ? `: ${input.reason}` : ''}`,
              data: {
                solutionId: solution._id,
                action: input.action,
                reason: input.reason
              }
            }
          ).catch(err => {
            logger.error('Failed to send moderation notification:', err);
          });
        }
        
        logger.info(`Solution moderated: ${input.solutionId}, action: ${input.action}, by admin: ${context.user._id}`);
        return moderationLog;
      } catch (error) {
        logger.error('Moderate solution mutation error:', error);
        throw error;
      }
    },
    
    editSolution: async (_, { input }, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to edit solutions');
        }
        
        const updateData = { ...input };
        delete updateData.solutionId;
        delete updateData.notes;
        
        const solution = await solutionService.updateSolution(
          input.solutionId,
          updateData,
          context.user._id,
          context.user.role
        );
        
        logger.info(`Solution edited by admin: ${context.user._id}, solution: ${input.solutionId}`);
        return solution;
      } catch (error) {
        logger.error('Edit solution mutation error:', error);
        throw error;
      }
    },
    
    approveSolution: async (_, { solutionId, reason, notifyUser }, context) => {
      try {
        if (!context.user || !['ADMIN', 'SUPER_ADMIN'].includes(context.user.role)) {
          throw new ForbiddenError('You do not have permission to approve solutions');
        }
        
        return await solutionManagementResolvers.Mutation.moderateSolution(_, {
          input: {
            solutionId,
            action: 'APPROVE',
            reason,
            notifyUser
          }
        }, context);
      } catch (error) {
        logger.error('Approve solution mutation error:', error);
        throw error;
      }
    }
  }
};

export default solutionManagementResolvers;