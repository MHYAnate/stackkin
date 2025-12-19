import User from '../../models/User.js';
import Solution from '../../models/Solution.js';
import Job from '../../models/Job.js';
import MarketplaceListing from '../../models/MarketplaceListing.js';
import Rating from '../../models/Rating.js';
import Squad from '../../models/Squad.js';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';

class UserService {
  // Get user by ID
  async getUserById(userId, includeSensitive = false) {
    try {
      let query = User.findById(userId);
      
      if (!includeSensitive) {
        query = query.select('-password -twoFactorSecret -twoFactorBackupCodes');
      }
      
      const user = await query;
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email, includeSensitive = false) {
    try {
      let query = User.findOne({ email: email.toLowerCase() });
      
      if (!includeSensitive) {
        query = query.select('-password -twoFactorSecret -twoFactorBackupCodes');
      }
      
      const user = await query;
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Get user by email error:', error);
      throw error;
    }
  }

  // Get user by username
  async getUserByUsername(username, includeSensitive = false) {
    try {
      let query = User.findOne({ username: username.toLowerCase() });
      
      if (!includeSensitive) {
        query = query.select('-password -twoFactorSecret -twoFactorBackupCodes');
      }
      
      const user = await query;
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Get user by username error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      // Remove restricted fields
      const restrictedFields = [
        'email', 'password', 'role', 'subscriptionTier',
        'isVerified', 'accountStatus', 'createdAt', 'updatedAt'
      ];
      
      restrictedFields.forEach(field => delete updateData[field]);
      
      // If updating username, check availability
      if (updateData.username) {
        const existingUser = await User.findOne({
          username: updateData.username.toLowerCase(),
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          throw new AppError('Username is already taken', 400);
        }
        updateData.username = updateData.username.toLowerCase();
      }
      
      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      logger.info(`Profile updated for user: ${user.email}`);
      
      return user;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  // Update avatar
  async updateAvatar(userId, avatarUrl) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Update avatar error:', error);
      throw error;
    }
  }

  // Update cover image
  async updateCoverImage(userId, coverImageUrl) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { coverImage: coverImageUrl },
        { new: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Update cover image error:', error);
      throw error;
    }
  }

  // Get user stats
  async getUserStats(userId) {
    try {
      const [
        solutionsCount,
        jobsCount,
        listingsCount,
        ratings,
        squads
      ] = await Promise.all([
        Solution.countDocuments({ user: userId }),
        Job.countDocuments({ user: userId }),
        MarketplaceListing.countDocuments({ user: userId }),
        Rating.find({ ratedUser: userId }),
        Squad.countDocuments({ members: userId })
      ]);
      
      // Calculate average rating
      let averageRating = 0;
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = totalRating / ratings.length;
      }
      
      // Get profile completeness from user
      const user = await User.findById(userId);
      const profileCompleteness = user ? user.calculateProfileCompleteness() : 0;
      
      // Calculate reputation score (simplified)
      const reputationScore = Math.floor(
        (solutionsCount * 10) +
        (jobsCount * 5) +
        (listingsCount * 3) +
        (averageRating * 20) +
        (squads * 15) +
        (user?.isVerified ? 50 : 0)
      );
      
      return {
        totalSolutions: solutionsCount,
        totalJobs: jobsCount,
        totalListings: listingsCount,
        totalRatings: ratings.length,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalViews: user?.profileViews || 0,
        totalClicks: 0, // Will be implemented with analytics
        profileCompleteness,
        reputationScore,
        leaderboardRank: null // Will be calculated separately
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  // Get user solutions
  async getUserSolutions(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [solutions, total] = await Promise.all([
        Solution.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'firstName lastName username avatar'),
        Solution.countDocuments({ user: userId })
      ]);
      
      return {
        solutions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user solutions error:', error);
      throw error;
    }
  }

  // Get user jobs
  async getUserJobs(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [jobs, total] = await Promise.all([
        Job.find({ user: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'firstName lastName username avatar'),
        Job.countDocuments({ user: userId })
      ]);
      
      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get user jobs error:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, filters = {}, pagination = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;
      
      const skip = (page - 1) * limit;
      
      // Build search query
      const searchQuery = {};
      
      // Text search
      if (query) {
        searchQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Apply filters
      if (filters.role) {
        searchQuery.role = filters.role;
      }
      
      if (filters.subscriptionTier) {
        searchQuery.subscriptionTier = filters.subscriptionTier;
      }
      
      if (filters.isVerified !== undefined) {
        searchQuery.isVerified = filters.isVerified;
      }
      
      if (filters.employmentStatus) {
        searchQuery.employmentStatus = filters.employmentStatus;
      }
      
      if (filters.nationality) {
        searchQuery.nationality = { $regex: filters.nationality, $options: 'i' };
      }
      
      if (filters.techStack && filters.techStack.length > 0) {
        searchQuery.techStack = { $in: filters.techStack };
      }
      
      if (filters.accountStatus) {
        searchQuery.accountStatus = filters.accountStatus;
      }
      
      if (filters.minYearsExperience) {
        searchQuery.yearsOfExperience = { $gte: filters.minYearsExperience };
      }
      
      if (filters.maxYearsExperience) {
        searchQuery.yearsOfExperience = {
          ...searchQuery.yearsOfExperience,
          $lte: filters.maxYearsExperience
        };
      }
      
      if (filters.availableForHire !== undefined) {
        searchQuery.availableForHire = filters.availableForHire;
      }
      
      // Only show active users
      searchQuery.accountStatus = 'ACTIVE';
      
      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('-password -twoFactorSecret -twoFactorBackupCodes')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(searchQuery)
      ]);
      
      // Get stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const stats = await this.getUserStats(user._id);
          return {
            ...user.toObject(),
            stats
          };
        })
      );
      
      return {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Search users error:', error);
      throw error;
    }
  }

  // Check email availability
  async checkEmailAvailability(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return !user;
    } catch (error) {
      logger.error('Check email availability error:', error);
      throw error;
    }
  }

  // Check username availability
  async checkUsernameAvailability(username) {
    try {
      const user = await User.findOne({ username: username.toLowerCase() });
      return !user;
    } catch (error) {
      logger.error('Check username availability error:', error);
      throw error;
    }
  }

  // Get talent pool (users available for hire)
  async getTalentPool(filters = {}, pagination = {}) {
    try {
      const baseFilters = {
        ...filters,
        availableForHire: true,
        accountStatus: 'ACTIVE'
      };
      
      return await this.searchUsers('', baseFilters, pagination);
    } catch (error) {
      logger.error('Get talent pool error:', error);
      throw error;
    }
  }

  // Update user streak
  async updateUserStreak(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActivity = user.lastActivityDate
        ? new Date(user.lastActivityDate)
        : null;
      
      let currentStreak = user.currentStreak || 0;
      
      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          currentStreak += 1;
        } else if (diffDays === 0) {
          // Already logged today
          currentStreak = currentStreak;
        } else {
          // Streak broken
          currentStreak = 1;
        }
      } else {
        // First activity
        currentStreak = 1;
      }
      
      // Update longest streak if needed
      const longestStreak = Math.max(user.longestStreak || 0, currentStreak);
      
      // Update streak protection
      let streakProtectionUsed = user.streakProtectionUsed || false;
      let streakProtectionAvailableDate = user.streakProtectionAvailableDate;
      
      if (currentStreak >= 7 && !streakProtectionUsed) {
        // Unlock streak protection after 7-day streak
        streakProtectionAvailableDate = new Date();
        streakProtectionUsed = false;
      }
      
      // Update user
      user.currentStreak = currentStreak;
      user.longestStreak = longestStreak;
      user.lastActivityDate = today;
      user.streakProtectionUsed = streakProtectionUsed;
      user.streakProtectionAvailableDate = streakProtectionAvailableDate;
      
      await user.save();
      
      return {
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        streakProtectionUsed,
        streakProtectionAvailableDate
      };
    } catch (error) {
      logger.error('Update user streak error:', error);
      throw error;
    }
  }

  // Use streak protection
  async useStreakProtection(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (user.streakProtectionUsed) {
        throw new AppError('Streak protection already used', 400);
      }
      
      if (!user.streakProtectionAvailableDate) {
        throw new AppError('Streak protection not available', 400);
      }
      
      const protectionAvailableDate = new Date(user.streakProtectionAvailableDate);
      const today = new Date();
      
      if (protectionAvailableDate > today) {
        throw new AppError('Streak protection not yet available', 400);
      }
      
      // Use streak protection to save streak
      user.streakProtectionUsed = true;
      user.currentStreak = user.currentStreak || 1;
      user.lastActivityDate = today;
      
      await user.save();
      
      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActivityDate: today,
        streakProtectionUsed: true,
        streakProtectionAvailableDate: null
      };
    } catch (error) {
      logger.error('Use streak protection error:', error);
      throw error;
    }
  }

  // Generate shareable profile link
  async generateShareableLink(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return `${baseUrl}/profile/${user.username}`;
    } catch (error) {
      logger.error('Generate shareable link error:', error);
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(userId, password) {
    try {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new AppError('Incorrect password', 401);
      }
      
      // Soft delete: deactivate account
      user.accountStatus = 'DEACTIVATED';
      user.deactivatedAt = new Date();
      user.email = `deactivated_${Date.now()}_${user.email}`;
      user.username = `deactivated_${Date.now()}_${user.username}`;
      
      await user.save();
      
      // Invalidate all sessions
      const Session = require('../../models/Session.js');
      await Session.deleteMany({ user: userId });
      
      logger.info(`Account deleted for user: ${userId}`);
      
      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }

  // Increment profile views
  async incrementProfileViews(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { profileViews: 1 } },
        { new: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      return user;
    } catch (error) {
      logger.error('Increment profile views error:', error);
      throw error;
    }
  }
}

export default new UserService();