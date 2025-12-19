import User from '../../models/User.js';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';

class ProfileService {
  // Complete profile information
  async completeProfile(userId, profileData) {
    try {
      const updateData = {
        nationality: profileData.nationality,
        techStack: profileData.techStack,
        employmentStatus: profileData.employmentStatus,
        bio: profileData.bio || '',
        yearsOfExperience: profileData.yearsOfExperience || 0,
        github: profileData.github || '',
        linkedin: profileData.linkedin || '',
        twitter: profileData.twitter || '',
        website: profileData.website || ''
      };
      
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      logger.info(`Profile completed for user: ${user.email}`);
      
      return user;
    } catch (error) {
      logger.error('Complete profile error:', error);
      throw error;
    }
  }

  // Get public profile by username
  async getPublicProfileByUsername(username) {
    try {
      const user = await User.findOne({ username: username.toLowerCase() })
        .select('-password -twoFactorSecret -twoFactorBackupCodes -email -phone -accountStatus');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (user.accountStatus !== 'ACTIVE') {
        throw new AppError('Profile not available', 404);
      }
      
      // Increment profile views
      await User.findByIdAndUpdate(user._id, {
        $inc: { profileViews: 1 }
      });
      
      // Get user stats and additional data
      const UserService = require('./user.service.js').default;
      const stats = await UserService.getUserStats(user._id);
      
      // Get solutions (limited)
      const Solution = require('../../models/Solution.js').default;
      const solutions = await Solution.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName username avatar');
      
      // Get squads
      const Squad = require('../../models/Squad.js').default;
      const squads = await Squad.find({ members: user._id })
        .limit(5)
        .populate('members', 'firstName lastName username avatar');
      
      // Get ratings
      const Rating = require('../../models/Rating.js').default;
      const ratings = await Rating.find({ ratedUser: user._id })
        .populate('rater', 'firstName lastName username avatar');
      
      // Calculate average rating
      let averageRating = 0;
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        averageRating = totalRating / ratings.length;
      }
      
      return {
        ...user.toObject(),
        stats,
        solutions,
        squads,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingsCount: ratings.length
      };
    } catch (error) {
      logger.error('Get public profile error:', error);
      throw error;
    }
  }

  // Get public profile by ID
  async getPublicProfileById(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -twoFactorSecret -twoFactorBackupCodes -email -phone -accountStatus');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (user.accountStatus !== 'ACTIVE') {
        throw new AppError('Profile not available', 404);
      }
      
      return await this.getPublicProfileByUsername(user.username);
    } catch (error) {
      logger.error('Get public profile by ID error:', error);
      throw error;
    }
  }

  // Update social links
  async updateSocialLinks(userId, socialLinks) {
    try {
      const updateData = {};
      
      if (socialLinks.github !== undefined) {
        updateData.github = socialLinks.github;
      }
      
      if (socialLinks.linkedin !== undefined) {
        updateData.linkedin = socialLinks.linkedin;
      }
      
      if (socialLinks.twitter !== undefined) {
        updateData.twitter = socialLinks.twitter;
      }
      
      if (socialLinks.website !== undefined) {
        updateData.website = socialLinks.website;
      }
      
      if (socialLinks.portfolio !== undefined) {
        updateData.portfolio = socialLinks.portfolio;
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Update social links error:', error);
      throw error;
    }
  }

  // Update professional information
  async updateProfessionalInfo(userId, professionalData) {
    try {
      const updateData = {};
      
      if (professionalData.techStack !== undefined) {
        updateData.techStack = professionalData.techStack;
      }
      
      if (professionalData.employmentStatus !== undefined) {
        updateData.employmentStatus = professionalData.employmentStatus;
      }
      
      if (professionalData.yearsOfExperience !== undefined) {
        updateData.yearsOfExperience = professionalData.yearsOfExperience;
      }
      
      if (professionalData.hourlyRate !== undefined) {
        updateData.hourlyRate = professionalData.hourlyRate;
      }
      
      if (professionalData.availableForHire !== undefined) {
        updateData.availableForHire = professionalData.availableForHire;
      }
      
      if (professionalData.preferredLanguages !== undefined) {
        updateData.preferredLanguages = professionalData.preferredLanguages;
      }
      
      if (professionalData.timezone !== undefined) {
        updateData.timezone = professionalData.timezone;
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Update professional info error:', error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId, privacyData) {
    try {
      const updateData = {};
      
      if (privacyData.showEmail !== undefined) {
        updateData.showEmail = privacyData.showEmail;
      }
      
      if (privacyData.showPhone !== undefined) {
        updateData.showPhone = privacyData.showPhone;
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      ).select('-password -twoFactorSecret -twoFactorBackupCodes');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      return user;
    } catch (error) {
      logger.error('Update privacy settings error:', error);
      throw error;
    }
  }

  // Get profile completeness score
  async getProfileCompleteness(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const completeness = user.calculateProfileCompleteness();
      
      // Get missing fields
      const missingFields = [];
      
      if (!user.avatar) missingFields.push('avatar');
      if (!user.bio || user.bio.trim().length === 0) missingFields.push('bio');
      if (!user.nationality) missingFields.push('nationality');
      if (!user.techStack || user.techStack.length === 0) missingFields.push('techStack');
      if (!user.yearsOfExperience || user.yearsOfExperience === 0) missingFields.push('yearsOfExperience');
      if (!user.portfolio) missingFields.push('portfolio');
      if (!user.isVerified) missingFields.push('verification');
      
      return {
        score: completeness,
        missingFields,
        suggestions: this.getProfileSuggestions(missingFields)
      };
    } catch (error) {
      logger.error('Get profile completeness error:', error);
      throw error;
    }
  }

  // Get profile suggestions
  getProfileSuggestions(missingFields) {
    const suggestions = [];
    
    if (missingFields.includes('avatar')) {
      suggestions.push('Add a profile picture to make your profile more personal');
    }
    
    if (missingFields.includes('bio')) {
      suggestions.push('Write a bio to tell others about yourself and your skills');
    }
    
    if (missingFields.includes('techStack')) {
      suggestions.push('Add your technical skills to help others find you');
    }
    
    if (missingFields.includes('portfolio')) {
      suggestions.push('Add a portfolio link to showcase your work');
    }
    
    if (missingFields.includes('verification')) {
      suggestions.push('Get verified to build trust with other users');
    }
    
    return suggestions;
  }
}

export default new ProfileService();