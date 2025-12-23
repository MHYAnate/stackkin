import Rating from '../../models/Rating.js';
import Solution from '../../models/Solution.js';
import User from '../../models/User.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';

class RatingService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Create rating
  async createRating(data, userId) {
    try {
      // Check if solution exists
      const solution = await Solution.findById(data.solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check if solution allows ratings
      if (!solution.allowRatings) {
        throw new ValidationError('This solution does not allow ratings');
      }

      // Check if user has already rated this solution
      const existingRating = await Rating.findOne({
        solution: data.solutionId,
        user: userId
      });

      if (existingRating) {
        throw new ValidationError('You have already rated this solution');
      }

      // Create rating
      const rating = new Rating({
        solution: data.solutionId,
        user: userId,
        rating: data.rating,
        comment: data.comment,
        pros: data.pros || [],
        cons: data.cons || []
      });

      await rating.save();

      // Update solution rating stats
      await Solution.updateRatingStats(data.solutionId);

      // Clear cache
      await this.clearRatingCache(data.solutionId);
      await this.clearSolutionCache(data.solutionId);

      logger.info(`Rating created: ${rating._id} for solution: ${data.solutionId} by user: ${userId}`);
      return rating;
    } catch (error) {
      logger.error('Create rating error:', error);
      throw error;
    }
  }

  // Update rating
  async updateRating(ratingId, data, userId, userRole) {
    try {
      const rating = await Rating.findById(ratingId);
      
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      // Check permissions
      if (!rating.canEdit(userId, userRole)) {
        throw new ValidationError('You do not have permission to edit this rating');
      }

      // Update rating
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          rating[key] = data[key];
        }
      });

      await rating.save();

      // Update solution rating stats
      await Solution.updateRatingStats(rating.solution);

      // Clear cache
      await this.clearRatingCache(rating.solution);
      await this.clearSolutionCache(rating.solution);

      logger.info(`Rating updated: ${ratingId} by user: ${userId}`);
      return rating;
    } catch (error) {
      logger.error('Update rating error:', error);
      throw error;
    }
  }

  // Delete rating
  async deleteRating(ratingId, userId, userRole) {
    try {
      const rating = await Rating.findById(ratingId);
      
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      // Check permissions
      if (!rating.canDelete(userId, userRole)) {
        throw new ValidationError('You do not have permission to delete this rating');
      }

      const solutionId = rating.solution;
      await rating.remove();

      // Update solution rating stats
      await Solution.updateRatingStats(solutionId);

      // Clear cache
      await this.clearRatingCache(solutionId);
      await this.clearSolutionCache(solutionId);

      logger.info(`Rating deleted: ${ratingId} by user: ${userId}`);
      return { deleted: true, message: 'Rating deleted successfully' };
    } catch (error) {
      logger.error('Delete rating error:', error);
      throw error;
    }
  }

  // Get ratings for a solution
  async getSolutionRatings(solutionId, pagination = {}) {
    try {
      const cacheKey = `ratings:solution:${solutionId}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      const query = Rating.find({ solution: solutionId })
        .populate('user', 'firstName lastName username avatar')
        .skip(skip)
        .limit(limit);

      // Apply sorting
      if (sortBy === 'helpful') {
        query.sort({ helpfulCount: sortOrder === 'desc' ? -1 : 1 });
      } else if (sortBy === 'rating') {
        query.sort({ rating: sortOrder === 'desc' ? -1 : 1 });
      } else {
        query.sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
      }

      const [ratings, totalCount] = await Promise.all([
        query.exec(),
        Rating.countDocuments({ solution: solutionId })
      ]);

      const result = {
        ratings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      };

      await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Get solution ratings error:', error);
      throw error;
    }
  }

  // Get user's ratings
  async getUserRatings(userId, pagination = {}) {
    try {
      const cacheKey = `ratings:user:${userId}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const [ratings, totalCount] = await Promise.all([
        Rating.find({ user: userId })
          .populate('solution', 'title slug thumbnailImage')
          .populate('solution.author', 'firstName lastName username')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Rating.countDocuments({ user: userId })
      ]);

      const result = {
        ratings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        }
      };

      await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Get user ratings error:', error);
      throw error;
    }
  }

  // Mark rating as helpful
  async markRatingHelpful(ratingId, userId) {
    try {
      const rating = await Rating.markHelpful(ratingId, userId);
      
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      // Clear cache
      await this.clearRatingCache(rating.solution);

      logger.info(`Rating marked helpful: ${ratingId} by user: ${userId}`);
      return rating;
    } catch (error) {
      logger.error('Mark rating helpful error:', error);
      throw error;
    }
  }

  // Report rating
  async reportRating(ratingId, reason, userId) {
    try {
      const rating = await Rating.report(ratingId);
      
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      // Log report
      logger.warn(`Rating reported: ${ratingId}, reason: ${reason}, by user: ${userId}`);

      // In a real app, you'd create a report record and notify admins
      
      return { reported: true, message: 'Rating reported successfully' };
    } catch (error) {
      logger.error('Report rating error:', error);
      throw error;
    }
  }

  // Respond to rating
  async respondToRating(ratingId, response, userId) {
    try {
      const rating = await Rating.findById(ratingId)
        .populate('solution');
      
      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      // Check if user is the solution author
      if (!rating.canRespond(userId)) {
        throw new ValidationError('Only the solution author can respond to ratings');
      }

      rating.authorResponse = response;
      rating.authorRespondedAt = new Date();
      await rating.save();

      // Clear cache
      await this.clearRatingCache(rating.solution._id);

      logger.info(`Response added to rating: ${ratingId} by solution author: ${userId}`);
      return rating;
    } catch (error) {
      logger.error('Respond to rating error:', error);
      throw error;
    }
  }

  // Get rating by ID
  async getRatingById(ratingId) {
    try {
      const cacheKey = `rating:${ratingId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const rating = await Rating.findById(ratingId)
        .populate('user', 'firstName lastName username avatar')
        .populate('solution', 'title slug author');

      if (!rating) {
        throw new NotFoundError('Rating not found');
      }

      await this.redis.setex(cacheKey, 300, JSON.stringify(rating));
      return rating;
    } catch (error) {
      logger.error('Get rating by ID error:', error);
      throw error;
    }
  }

  // Cache clearing methods
  async clearRatingCache(solutionId) {
    const keys = await this.redis.keys(`ratings:solution:${solutionId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearSolutionCache(solutionId) {
    const keys = await this.redis.keys(`solution:*${solutionId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export default new RatingService();