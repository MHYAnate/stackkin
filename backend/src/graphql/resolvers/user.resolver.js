import UserService from '../../services/user/user.service.js';
import AuthService from '../../services/auth/auth.service.js';
import ProfileService from '../../services/user/profile.service.js';
import VerificationService from '../../services/user/verification.service.js';
import { AppError } from '../../errors/AppError.js';

export const userResolvers = {
  Query: {
    // Get current user
    me: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.getUserById(context.user._id);
    },

    // Get current user profile
    myProfile: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.getUserById(context.user._id);
    },

    // Get user by username
    userByUsername: async (_, { username }, context) => {
      return await ProfileService.getPublicProfileByUsername(username);
    },

    // Get user by ID
    userById: async (_, { id }, context) => {
      return await ProfileService.getPublicProfileById(id);
    },

    // Get shareable profile
    shareableProfile: async (_, { username }, context) => {
      return await ProfileService.getPublicProfileByUsername(username);
    },

    // Search users
    searchUsers: async (_, { query, filter, pagination }, context) => {
      const result = await UserService.searchUsers(query, filter, pagination);
      
      return {
        edges: result.users.map(user => ({
          node: user,
          cursor: user._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.pagination.page < result.pagination.pages,
          hasPreviousPage: result.pagination.page > 1,
          startCursor: result.users[0]?._id.toString(),
          endCursor: result.users[result.users.length - 1]?._id.toString(),
          currentPage: result.pagination.page,
          totalPages: result.pagination.pages
        },
        totalCount: result.pagination.total
      };
    },

    // Get talent pool
    talentPool: async (_, { filter, pagination }, context) => {
      const result = await UserService.getTalentPool(filter, pagination);
      
      return {
        edges: result.users.map(user => ({
          node: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            nationality: user.nationality,
            location: user.location,
            techStack: user.techStack,
            employmentStatus: user.employmentStatus,
            yearsOfExperience: user.yearsOfExperience,
            hourlyRate: user.hourlyRate,
            availableForHire: user.availableForHire,
            isVerified: user.isVerified,
            subscriptionTier: user.subscriptionTier,
            averageRating: user.stats.averageRating,
            reputationScore: user.stats.reputationScore,
            solutionsCount: user.stats.totalSolutions
          },
          cursor: user._id.toString()
        })),
        pageInfo: {
          hasNextPage: result.pagination.page < result.pagination.pages,
          hasPreviousPage: result.pagination.page > 1,
          startCursor: result.users[0]?._id.toString(),
          endCursor: result.users[result.users.length - 1]?._id.toString(),
          currentPage: result.pagination.page,
          totalPages: result.pagination.pages
        },
        totalCount: result.pagination.total
      };
    },

    // Check email availability
    checkEmailAvailability: async (_, { email }) => {
      return await UserService.checkEmailAvailability(email);
    },

    // Check username availability
    checkUsernameAvailability: async (_, { username }) => {
      return await UserService.checkUsernameAvailability(username);
    },

    // Get user sessions
    mySessions: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await AuthService.getUserSessions(context.user._id);
    },

    // Get user verification status
    myVerificationStatus: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await VerificationService.getUserVerification(context.user._id);
    },

    // Get two-factor status
    getTwoFactorStatus: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const user = await UserService.getUserById(context.user._id, true);
      
      return {
        enabled: user.twoFactorEnabled,
        method: user.twoFactorMethod,
        verifiedAt: user.twoFactorVerifiedAt
      };
    }
  },

  Mutation: {
    // Register
    register: async (_, { input }) => {
      const result = await AuthService.register(input);
      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.'
      };
    },

    // Login
    login: async (_, { input }, context) => {
      const { email, password, rememberMe } = input;
      
      // Get device info from context
      const deviceInfo = {
        browser: context.req.headers['user-agent'],
        ipAddress: context.req.ip,
        ...context.req.deviceInfo
      };
      
      const result = await AuthService.login(email, password, deviceInfo);
      
      // If two-factor is enabled, return requiresTwoFactor flag
      if (result.requiresTwoFactor) {
        return {
          user: result.user,
          accessToken: null,
          refreshToken: null,
          expiresIn: 0,
          requiresTwoFactor: true
        };
      }
      
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        requiresTwoFactor: false
      };
    },

    // Logout
    logout: async (_, __, context) => {
      if (!context.user || !context.sessionId) {
        throw new AppError('Authentication required', 401);
      }
      
      return await AuthService.logout(context.sessionId);
    },

    // Logout all devices
    logoutAllDevices: async (_, __, context) => {
      if (!context.user || !context.sessionId) {
        throw new AppError('Authentication required', 401);
      }
      
      return await AuthService.terminateAllOtherSessions(context.user._id, context.sessionId);
    },

    // Refresh token
    refreshToken: async (_, { refreshToken }) => {
      return await AuthService.refreshToken(refreshToken);
    },

    // Verify email
    verifyEmail: async (_, { token }) => {
      return await AuthService.verifyEmail(token);
    },

    // Resend verification email
    resendVerificationEmail: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const user = await UserService.getUserById(context.user._id);
      return await AuthService.resendVerificationEmail(user.email);
    },

    // Change password
    changePassword: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const { currentPassword, newPassword, confirmPassword } = input;
      
      if (newPassword !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
      }
      
      return await AuthService.changePassword(context.user._id, currentPassword, newPassword);
    },

    // Forgot password
    forgotPassword: async (_, { input }) => {
      const { email } = input;
      return await AuthService.forgotPassword(email);
    },

    // Reset password
    resetPassword: async (_, { input }) => {
      const { token, newPassword, confirmPassword } = input;
      
      if (newPassword !== confirmPassword) {
        throw new AppError('Passwords do not match', 400);
      }
      
      return await AuthService.resetPassword(token, newPassword);
    },

    // Complete profile info
    completeProfileInfo: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await ProfileService.completeProfile(context.user._id, input);
    },

    // Update profile
    updateProfile: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.updateProfile(context.user._id, input);
    },

    // Update avatar
    updateAvatar: async (_, { image }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.updateAvatar(context.user._id, image);
    },

    // Update cover image
    updateCoverImage: async (_, { image }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.updateCoverImage(context.user._id, image);
    },

    // Delete account
    deleteAccount: async (_, { password }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.deleteAccount(context.user._id, password);
    },

    // Submit verification documents
    submitVerificationDocuments: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await VerificationService.submitVerification(context.user._id, input);
    },

    // Setup two-factor authentication
    setupTwoFactor: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const { method, phoneNumber } = input;
      return await AuthService.setupTwoFactor(context.user._id, method, phoneNumber);
    },

    // Enable two-factor authentication
    enableTwoFactor: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const { code, backupCode } = input;
      const method = backupCode ? 'BACKUP' : 'APP';
      
      return await AuthService.enableTwoFactor(context.user._id, code);
    },

    // Disable two-factor authentication
    disableTwoFactor: async (_, { input }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const { code, backupCode } = input;
      return await AuthService.disableTwoFactor(context.user._id, code);
    },

    // Regenerate backup codes
    regenerateBackupCodes: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const user = await UserService.getUserById(context.user._id, true);
      
      // Generate new backup codes
      const crypto = require('crypto');
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
      
      user.twoFactorBackupCodes = backupCodes;
      await user.save({ validateBeforeSave: false });
      
      return backupCodes;
    },

    // Terminate session
    terminateSession: async (_, { sessionId }, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await AuthService.terminateSession(context.user._id, sessionId);
    },

    // Terminate all other sessions
    terminateAllOtherSessions: async (_, __, context) => {
      if (!context.user || !context.sessionId) {
        throw new AppError('Authentication required', 401);
      }
      
      return await AuthService.terminateAllOtherSessions(context.user._id, context.sessionId);
    },

    // Use streak protection
    useStreakProtection: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.useStreakProtection(context.user._id);
    },

    // Generate shareable link
    generateShareableLink: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      return await UserService.generateShareableLink(context.user._id);
    },

    // Generate QR code (placeholder - implement QR generation)
    generateQRCode: async (_, __, context) => {
      if (!context.user) {
        throw new AppError('Authentication required', 401);
      }
      
      const user = await UserService.getUserById(context.user._id);
      const shareableLink = await UserService.generateShareableLink(context.user._id);
      
      // In a real implementation, generate QR code here
      // For now, return a placeholder
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareableLink)}`;
    }
  },

  Subscription: {
    // User updated subscription
    userUpdated: {
      subscribe: (_, { userId }, { pubsub }) => {
        return pubsub.asyncIterator(`USER_UPDATED_${userId}`);
      }
    },

    // Achievement unlocked subscription
    achievementUnlocked: {
      subscribe: (_, __, { user, pubsub }) => {
        if (!user) {
          throw new AppError('Authentication required', 401);
        }
        return pubsub.asyncIterator(`ACHIEVEMENT_UNLOCKED_${user._id}`);
      }
    },

    // Badge earned subscription
    badgeEarned: {
      subscribe: (_, __, { user, pubsub }) => {
        if (!user) {
          throw new AppError('Authentication required', 401);
        }
        return pubsub.asyncIterator(`BADGE_EARNED_${user._id}`);
      }
    },

    // Streak updated subscription
    streakUpdated: {
      subscribe: (_, __, { user, pubsub }) => {
        if (!user) {
          throw new AppError('Authentication required', 401);
        }
        return pubsub.asyncIterator(`STREAK_UPDATED_${user._id}`);
      }
    }
  },

  User: {
    // Resolve stats field
    stats: async (parent, _, context) => {
      return await UserService.getUserStats(parent._id);
    },

    // Resolve fullName field
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    },

    // Resolve solutions field
    solutions: async (parent, _, context) => {
      const Solution = require('../../models/Solution.js').default;
      return await Solution.find({ user: parent._id })
        .limit(10)
        .sort({ createdAt: -1 });
    },

    // Resolve solutionsCount field
    solutionsCount: async (parent, _, context) => {
      const Solution = require('../../models/Solution.js').default;
      return await Solution.countDocuments({ user: parent._id });
    },

    // Resolve jobs field
    jobs: async (parent, _, context) => {
      const Job = require('../../models/Job.js').default;
      return await Job.find({ user: parent._id })
        .limit(10)
        .sort({ createdAt: -1 });
    },

    // Resolve jobsCount field
    jobsCount: async (parent, _, context) => {
      const Job = require('../../models/Job.js').default;
      return await Job.countDocuments({ user: parent._id });
    },

    // Resolve marketplaceListings field
    marketplaceListings: async (parent, _, context) => {
      const MarketplaceListing = require('../../models/MarketplaceListing.js').default;
      return await MarketplaceListing.find({ user: parent._id })
        .limit(10)
        .sort({ createdAt: -1 });
    },

    // Resolve squads field
    squads: async (parent, _, context) => {
      const Squad = require('../../models/Squad.js').default;
      return await Squad.find({ members: parent._id })
        .limit(5)
        .populate('members', 'firstName lastName username avatar');
    },

    // Resolve ratings field
    ratings: async (parent, _, context) => {
      const Rating = require('../../models/Rating.js').default;
      return await Rating.find({ ratedUser: parent._id })
        .limit(10)
        .populate('rater', 'firstName lastName username avatar');
    },

    // Resolve averageRating field
    averageRating: async (parent, _, context) => {
      const Rating = require('../../models/Rating.js').default;
      const ratings = await Rating.find({ ratedUser: parent._id });
      
      if (ratings.length === 0) {
        return 0;
      }
      
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      return parseFloat((totalRating / ratings.length).toFixed(2));
    },

    // Resolve shareableLink field
    shareableLink: async (parent, _, context) => {
      return await UserService.generateShareableLink(parent._id);
    },

    // Resolve qrCode field
    qrCode: async (parent, _, context) => {
      const shareableLink = await UserService.generateShareableLink(parent._id);
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareableLink)}`;
    },

    // Resolve achievements field (placeholder)
    achievements: async (parent, _, context) => {
      // Implement achievements logic
      return [];
    },

    // Resolve badges field (placeholder)
    badges: async (parent, _, context) => {
      // Implement badges logic
      return [];
    },

    // Resolve streak field
    streak: async (parent, _, context) => {
      return {
        currentStreak: parent.currentStreak || 0,
        longestStreak: parent.longestStreak || 0,
        lastActivityDate: parent.lastActivityDate,
        streakProtectionUsed: parent.streakProtectionUsed || false,
        streakProtectionAvailableDate: parent.streakProtectionAvailableDate
      };
    },

    // Resolve subscription field
    subscription: async (parent, _, context) => {
      if (!parent.subscription) {
        return null;
      }
      
      const Subscription = require('../../models/Subscription.js').default;
      return await Subscription.findById(parent.subscription);
    }
  },

  PublicProfile: {
    // Resolve stats for public profile
    stats: async (parent, _, context) => {
      return await UserService.getUserStats(parent._id);
    },

    // Resolve fullName for public profile
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    },

    // Resolve solutions for public profile
    solutions: async (parent, _, context) => {
      const Solution = require('../../models/Solution.js').default;
      return await Solution.find({ user: parent._id })
        .limit(5)
        .sort({ createdAt: -1 })
        .populate('user', 'firstName lastName username avatar');
    },

    // Resolve averageRating for public profile
    averageRating: async (parent, _, context) => {
      const Rating = require('../../models/Rating.js').default;
      const ratings = await Rating.find({ ratedUser: parent._id });
      
      if (ratings.length === 0) {
        return 0;
      }
      
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      return parseFloat((totalRating / ratings.length).toFixed(2));
    },

    // Resolve squads for public profile
    squads: async (parent, _, context) => {
      const Squad = require('../../models/Squad.js').default;
      return await Squad.find({ members: parent._id })
        .limit(3)
        .populate('members', 'firstName lastName username avatar');
    },

    // Resolve achievements for public profile (placeholder)
    achievements: async (parent, _, context) => {
      return [];
    },

    // Resolve badges for public profile (placeholder)
    badges: async (parent, _, context) => {
      return [];
    }
  }
};

export default userResolvers;