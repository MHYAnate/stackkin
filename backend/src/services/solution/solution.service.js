import Solution from '../../models/Solution.js';
import Category from '../../models/Category.js';
import Rating from '../../models/Rating.js';
import Complaint from '../../models/Complaint.js';
import User from '../../models/User.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';

class SolutionService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Create solution
  async createSolution(data, userId) {
    try {
      // Validate category exists
      const category = await Category.findById(data.category);
      if (!category) {
        throw new ValidationError('Invalid category');
      }

      // Check if user exists and is active
      const user = await User.findById(userId);
      if (!user || user.accountStatus !== 'ACTIVE') {
        throw new ValidationError('User not found or account not active');
      }

      // Create solution
      const solution = new Solution({
        ...data,
        author: userId
      });

      await solution.save();

      // Increment category solution count
      await Category.findByIdAndUpdate(data.category, {
        $inc: { solutionsCount: 1 }
      });

      // Clear cache
      await this.clearUserSolutionsCache(userId);
      await this.clearCategoryCache(data.category);

      logger.info(`Solution created: ${solution._id} by user: ${userId}`);
      return solution;
    } catch (error) {
      logger.error('Create solution error:', error);
      throw error;
    }
  }

  // Get solution by ID
  async getSolutionById(solutionId, userId = null) {
    try {
      const cacheKey = `solution:${solutionId}:${userId || 'public'}`;
      
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const solution = await Solution.findById(solutionId)
        .populate('author', 'firstName lastName username avatar email')
        .populate('category', 'name slug icon color');

      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check if user can view
      if (!solution.canView(userId)) {
        throw new ValidationError('You do not have permission to view this solution');
      }

      // Cache result
      await this.redis.setex(cacheKey, 300, JSON.stringify(solution)); // 5 minutes cache

      return solution;
    } catch (error) {
      logger.error('Get solution by ID error:', error);
      throw error;
    }
  }

  // Get solution by slug
  async getSolutionBySlug(slug, userId = null) {
    try {
      const cacheKey = `solution:slug:${slug}:${userId || 'public'}`;
      
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const solution = await Solution.findOne({ slug })
        .populate('author', 'firstName lastName username avatar email')
        .populate('category', 'name slug icon color');

      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check if user can view
      if (!solution.canView(userId)) {
        throw new ValidationError('You do not have permission to view this solution');
      }

      // Cache result
      await this.redis.setex(cacheKey, 300, JSON.stringify(solution));

      return solution;
    } catch (error) {
      logger.error('Get solution by slug error:', error);
      throw error;
    }
  }

  // Update solution
  async updateSolution(solutionId, data, userId, userRole) {
    try {
      const solution = await Solution.findById(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check permissions
      if (!solution.canEdit(userId, userRole)) {
        throw new ValidationError('You do not have permission to edit this solution');
      }

      // If changing category, update counts
      if (data.category && data.category !== solution.category.toString()) {
        const oldCategory = solution.category;
        const newCategory = await Category.findById(data.category);
        
        if (!newCategory) {
          throw new ValidationError('Invalid category');
        }

        // Update counts
        await Promise.all([
          Category.findByIdAndUpdate(oldCategory, { $inc: { solutionsCount: -1 } }),
          Category.findByIdAndUpdate(data.category, { $inc: { solutionsCount: 1 } })
        ]);

        // Clear caches
        await this.clearCategoryCache(oldCategory);
        await this.clearCategoryCache(data.category);
      }

      // Update solution
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          solution[key] = data[key];
        }
      });

      await solution.save();

      // Clear caches
      await this.clearSolutionCache(solutionId);
      await this.clearUserSolutionsCache(userId);

      logger.info(`Solution updated: ${solutionId} by user: ${userId}`);
      return solution;
    } catch (error) {
      logger.error('Update solution error:', error);
      throw error;
    }
  }

  // Delete solution
  async deleteSolution(solutionId, userId, userRole, reason = '') {
    try {
      const solution = await Solution.findById(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check permissions
      if (!solution.canDelete(userId, userRole)) {
        throw new ValidationError('You do not have permission to delete this solution');
      }

      // Decrement category count
      await Category.findByIdAndUpdate(solution.category, {
        $inc: { solutionsCount: -1 }
      });

      // Soft delete or hard delete based on status
      let result;
      if (solution.status === 'ARCHIVED') {
        // Hard delete
        await solution.remove();
        result = { deleted: true, message: 'Solution permanently deleted' };
      } else {
        // Soft delete (archive)
        solution.status = 'ARCHIVED';
        await solution.save();
        result = { deleted: true, message: 'Solution archived' };
      }

      // Clear caches
      await this.clearSolutionCache(solutionId);
      await this.clearUserSolutionsCache(userId);
      await this.clearCategoryCache(solution.category);

      logger.info(`Solution deleted: ${solutionId} by user: ${userId}, reason: ${reason}`);
      return result;
    } catch (error) {
      logger.error('Delete solution error:', error);
      throw error;
    }
  }

  // Get solutions with filtering and pagination
  async getSolutions(filter = {}, pagination = {}, userId = null) {
    try {
      const cacheKey = `solutions:${JSON.stringify(filter)}:${JSON.stringify(pagination)}:${userId || 'public'}`;
      
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      let query = Solution.find();

      // Apply filters
      if (filter.category) {
        query = query.where('category', filter.category);
      }

      if (filter.type) {
        query = query.where('type', filter.type);
      }

      if (filter.pricingModel) {
        query = query.where('pricingModel', filter.pricingModel);
      }

      if (filter.minRating) {
        query = query.where('averageRating').gte(filter.minRating);
      }

      if (filter.maxRating) {
        query = query.where('averageRating').lte(filter.maxRating);
      }

      if (filter.isPremium !== undefined) {
        query = query.where('isPremium', filter.isPremium);
      }

      if (filter.authorId) {
        query = query.where('author', filter.authorId);
      }

      if (filter.search) {
        query = query.find({
          $or: [
            { title: { $regex: filter.search, $options: 'i' } },
            { description: { $regex: filter.search, $options: 'i' } },
            { tags: { $regex: filter.search, $options: 'i' } }
          ]
        });
      }

      if (filter.status) {
        query = query.where('status', filter.status);
      }

      if (filter.visibility) {
        query = query.where('visibility', filter.visibility);
      }

      // Only show visible solutions for non-admins
      if (!userId || (await User.findById(userId))?.role !== 'ADMIN') {
        query = query.where('status', 'PUBLISHED')
                     .where('visibility', 'PUBLIC');
      }

      // Apply sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      query = query.sort(sort);

      // Apply pagination
      query = query.skip(skip).limit(limit);

      // Populate fields
      query = query.populate('author', 'firstName lastName username avatar')
                  .populate('category', 'name slug icon color');

      const [solutions, totalCount] = await Promise.all([
        query.exec(),
        Solution.countDocuments(query.getFilter())
      ]);

      const result = {
        solutions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      };

      // Cache result
      await this.redis.setex(cacheKey, 60, JSON.stringify(result)); // 1 minute cache

      return result;
    } catch (error) {
      logger.error('Get solutions error:', error);
      throw error;
    }
  }

  // Get user's solutions
  async getUserSolutions(userId, filter = {}, pagination = {}) {
    try {
      const cacheKey = `user:solutions:${userId}:${JSON.stringify(filter)}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      filter.authorId = userId;
      const result = await this.getSolutions(filter, pagination, userId);

      await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Get user solutions error:', error);
      throw error;
    }
  }

  // Increment solution views
  async incrementViews(solutionId) {
    try {
      const solution = await Solution.incrementViews(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Clear cache
      await this.clearSolutionCache(solutionId);

      return solution;
    } catch (error) {
      logger.error('Increment views error:', error);
      throw error;
    }
  }

  // Save/unsave solution
  async toggleSave(solutionId, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      const isSaved = user.savedSolutions?.includes(solutionId);
      
      if (isSaved) {
        // Unsave
        await Promise.all([
          User.findByIdAndUpdate(userId, { $pull: { savedSolutions: solutionId } }),
          Solution.findByIdAndUpdate(solutionId, { $inc: { saves: -1 } })
        ]);
        return { saved: false, message: 'Solution unsaved' };
      } else {
        // Save
        await Promise.all([
          User.findByIdAndUpdate(userId, { $addToSet: { savedSolutions: solutionId } }),
          Solution.findByIdAndUpdate(solutionId, { $inc: { saves: 1 } })
        ]);
        return { saved: true, message: 'Solution saved' };
      }
    } catch (error) {
      logger.error('Toggle save error:', error);
      throw error;
    }
  }

  // Share solution
  async shareSolution(solutionId, platform = null) {
    try {
      const solution = await Solution.incrementShares(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Log sharing activity
      logger.info(`Solution shared: ${solutionId}, platform: ${platform || 'unknown'}`);

      return solution;
    } catch (error) {
      logger.error('Share solution error:', error);
      throw error;
    }
  }

  // Publish solution
  async publishSolution(solutionId, userId, userRole) {
    try {
      const solution = await Solution.findById(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check permissions
      if (!solution.canEdit(userId, userRole)) {
        throw new ValidationError('You do not have permission to publish this solution');
      }

      if (solution.status === 'PUBLISHED') {
        throw new ValidationError('Solution is already published');
      }

      // Validate required fields
      if (!solution.contactEmail) {
        throw new ValidationError('Contact email is required for publishing');
      }

      if (!solution.images || solution.images.length === 0) {
        throw new ValidationError('At least one image is required for publishing');
      }

      solution.status = 'PUBLISHED';
      solution.publishedAt = new Date();
      await solution.save();

      // Clear cache
      await this.clearSolutionCache(solutionId);

      logger.info(`Solution published: ${solutionId} by user: ${userId}`);
      return solution;
    } catch (error) {
      logger.error('Publish solution error:', error);
      throw error;
    }
  }

  // Archive solution
  async archiveSolution(solutionId, userId, userRole) {
    try {
      const solution = await Solution.findById(solutionId);
      
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      if (!solution.canEdit(userId, userRole)) {
        throw new ValidationError('You do not have permission to archive this solution');
      }

      solution.status = 'ARCHIVED';
      await solution.save();

      // Clear cache
      await this.clearSolutionCache(solutionId);

      logger.info(`Solution archived: ${solutionId} by user: ${userId}`);
      return solution;
    } catch (error) {
      logger.error('Archive solution error:', error);
      throw error;
    }
  }

  // Get featured solutions
  async getFeaturedSolutions(limit = 10) {
    try {
      const cacheKey = `solutions:featured:${limit}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const solutions = await Solution.find({
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        isFeatured: true
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug icon color');

      await this.redis.setex(cacheKey, 300, JSON.stringify(solutions));
      return solutions;
    } catch (error) {
      logger.error('Get featured solutions error:', error);
      throw error;
    }
  }

  // Get top solutions
  async getTopSolutions(categoryId = null, limit = 10) {
    try {
      const cacheKey = `solutions:top:${categoryId || 'all'}:${limit}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        averageRating: { $gte: 4.0 },
        ratingsCount: { $gte: 5 }
      };

      if (categoryId) {
        query.category = categoryId;
      }

      const solutions = await Solution.find(query)
        .sort({ averageRating: -1, ratingsCount: -1 })
        .limit(limit)
        .populate('author', 'firstName lastName username avatar')
        .populate('category', 'name slug icon color');

      const result = solutions.map((solution, index) => ({
        rank: index + 1,
        solution,
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        periodEnd: new Date()
      }));

      await this.redis.setex(cacheKey, 600, JSON.stringify(result)); // 10 minutes cache
      return result;
    } catch (error) {
      logger.error('Get top solutions error:', error);
      throw error;
    }
  }

  // Get premium solutions
  async getPremiumSolutions(categoryId = null, pagination = {}) {
    try {
      const cacheKey = `solutions:premium:${categoryId || 'all'}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const filter = {
        isPremium: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      };

      if (categoryId) {
        filter.category = categoryId;
      }

      const result = await this.getSolutions(filter, pagination);

      await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Get premium solutions error:', error);
      throw error;
    }
  }

  // Search solutions
  async searchSolutions(query, filter = {}, pagination = {}) {
    try {
      const cacheKey = `solutions:search:${query}:${JSON.stringify(filter)}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      filter.search = query;
      const result = await this.getSolutions(filter, pagination);

      await this.redis.setex(cacheKey, 60, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Search solutions error:', error);
      throw error;
    }
  }

  // Get suggested solutions
  async getSuggestedSolutions(solutionId, limit = 5) {
    try {
      const cacheKey = `solutions:suggested:${solutionId}:${limit}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Find similar solutions based on category, tags, and tech stack
      const suggested = await Solution.find({
        _id: { $ne: solutionId },
        category: solution.category,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        $or: [
          { tags: { $in: solution.tags } },
          { techStack: { $in: solution.techStack } }
        ]
      })
      .sort({ averageRating: -1, ratingsCount: -1 })
      .limit(limit)
      .populate('author', 'firstName lastName username avatar')
      .populate('category', 'name slug icon color');

      await this.redis.setex(cacheKey, 300, JSON.stringify(suggested));
      return suggested;
    } catch (error) {
      logger.error('Get suggested solutions error:', error);
      throw error;
    }
  }

  // Get trending tags
  async getTrendingTags(limit = 10) {
    try {
      const cacheKey = `tags:trending:${limit}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const trendingTags = await Solution.aggregate([
        {
          $match: {
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
            averageRating: { $avg: '$averageRating' }
          }
        },
        { $sort: { count: -1, averageRating: -1 } },
        { $limit: limit },
        {
          $project: {
            tag: '$_id',
            count: 1,
            averageRating: { $round: ['$averageRating', 2] },
            _id: 0
          }
        }
      ]);

      const tags = trendingTags.map(item => item.tag);

      await this.redis.setex(cacheKey, 3600, JSON.stringify(tags)); // 1 hour cache
      return tags;
    } catch (error) {
      logger.error('Get trending tags error:', error);
      throw error;
    }
  }

  // Get solution stats
  async getSolutionStats(solutionId) {
    try {
      const cacheKey = `solution:stats:${solutionId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Get daily stats for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Note: In a real app, you'd have a separate analytics collection
      // For now, we'll return mock data
      const stats = {
        totalViews: solution.views,
        uniqueViews: Math.floor(solution.views * 0.7), // Mock unique views
        totalClicks: solution.clicks,
        totalShares: solution.shares,
        totalSaves: solution.saves,
        averageRating: solution.averageRating,
        totalRatings: solution.ratingsCount,
        viewsByDay: this.generateMockDailyStats(30, solution.views),
        clicksByDay: this.generateMockDailyStats(30, solution.clicks),
        topReferrers: this.generateMockReferrers()
      };

      await this.redis.setex(cacheKey, 300, JSON.stringify(stats));
      return stats;
    } catch (error) {
      logger.error('Get solution stats error:', error);
      throw error;
    }
  }

  // Get category stats
  async getCategoryStats(categoryId) {
    try {
      const cacheKey = `category:stats:${categoryId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      const [solutions, topSolutions] = await Promise.all([
        Solution.find({
          category: categoryId,
          status: 'PUBLISHED',
          visibility: 'PUBLIC'
        })
        .sort({ averageRating: -1 })
        .limit(10)
        .populate('author', 'firstName lastName username avatar'),
        
        Solution.aggregate([
          {
            $match: {
              category: categoryId,
              status: 'PUBLISHED',
              visibility: 'PUBLIC'
            }
          },
          { $unwind: '$tags' },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { tag: '$_id', count: 1, _id: 0 } }
        ])
      ]);

      const stats = {
        totalSolutions: category.solutionsCount,
        totalViews: await Solution.aggregate([
          { $match: { category: categoryId } },
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]).then(result => result[0]?.totalViews || 0),
        averageRating: await Solution.aggregate([
          { $match: { category: categoryId, averageRating: { $gt: 0 } } },
          { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
        ]).then(result => Math.round((result[0]?.avgRating || 0) * 10) / 10),
        topSolutions: solutions,
        trendingTags: topSolutions.map(item => item.tag)
      };

      await this.redis.setex(cacheKey, 600, JSON.stringify(stats)); // 10 minutes cache
      return stats;
    } catch (error) {
      logger.error('Get category stats error:', error);
      throw error;
    }
  }

  // Upgrade to premium
  async upgradeToPremium(solutionId, paymentMethod = 'zainpay') {
    try {
      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      if (solution.isPremium) {
        throw new ValidationError('Solution is already premium');
      }

      // In a real app, you'd process payment here
      // For now, we'll simulate payment success
      const paymentReference = `PREMIUM_${solutionId}_${Date.now()}`;

      // Update solution
      solution.isPremium = true;
      solution.price = process.env.SOLUTION_PREMIUM_UPGRADE || 100000; // 1000 Naira in kobo
      await solution.save();

      // Clear cache
      await this.clearSolutionCache(solutionId);

      logger.info(`Solution upgraded to premium: ${solutionId}, payment ref: ${paymentReference}`);
      
      return {
        success: true,
        solution,
        paymentReference,
        message: 'Solution successfully upgraded to premium'
      };
    } catch (error) {
      logger.error('Upgrade to premium error:', error);
      throw error;
    }
  }

  // Cache clearing methods
  async clearSolutionCache(solutionId) {
    const keys = await this.redis.keys(`solution:*${solutionId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearUserSolutionsCache(userId) {
    const keys = await this.redis.keys(`user:solutions:${userId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearCategoryCache(categoryId) {
    const keys = await this.redis.keys(`*category*${categoryId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Helper methods for mock data
  generateMockDailyStats(days, total) {
    const stats = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate random but decreasing counts
      const maxForDay = Math.floor(total / days * (1 + Math.random() * 0.5));
      const count = Math.floor(Math.random() * maxForDay);
      
      stats.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    return stats;
  }

  generateMockReferrers() {
    const referrers = [
      { source: 'Direct', count: 150, percentage: 30 },
      { source: 'Google Search', count: 120, percentage: 24 },
      { source: 'Stackkin Platform', count: 100, percentage: 20 },
      { source: 'Social Media', count: 80, percentage: 16 },
      { source: 'Email', count: 50, percentage: 10 }
    ];
    
    return referrers;
  }
}

export default new SolutionService();