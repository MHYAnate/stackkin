import Verification from '../../models/Verification.js';
import User from '../../models/User.js';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';

class VerificationService {
  // Submit verification documents
  async submitVerification(userId, documentData) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check if user already has pending verification
      const pendingVerification = await Verification.findOne({
        user: userId,
        status: 'PENDING'
      });
      
      if (pendingVerification) {
        throw new AppError('You already have a pending verification request', 400);
      }
      
      // Check if user is already verified
      if (user.isVerified) {
        throw new AppError('You are already verified', 400);
      }
      
      // Create verification document
      const verification = new Verification({
        user: userId,
        documentType: documentData.documentType,
        documentNumber: documentData.documentNumber,
        documentImage: documentData.documentImage,
        additionalImage: documentData.additionalImage,
        expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : null,
        status: 'PENDING'
      });
      
      await verification.save();
      
      // Update user verification status
      user.verificationStatus = 'PENDING';
      user.verificationDocuments.push(verification._id);
      await user.save();
      
      logger.info(`Verification submitted for user: ${user.email}`);
      
      return verification;
    } catch (error) {
      logger.error('Submit verification error:', error);
      throw error;
    }
  }

  // Get user verification status
  async getUserVerification(userId) {
    try {
      const verification = await Verification.findOne({
        user: userId,
        status: { $in: ['PENDING', 'APPROVED'] }
      }).sort({ createdAt: -1 });
      
      return verification;
    } catch (error) {
      logger.error('Get user verification error:', error);
      throw error;
    }
  }

  // Approve verification
  async approveVerification(verificationId, adminId) {
    try {
      const verification = await Verification.findById(verificationId);
      
      if (!verification) {
        throw new AppError('Verification request not found', 404);
      }
      
      if (verification.status !== 'PENDING') {
        throw new AppError(`Verification is already ${verification.status.toLowerCase()}`, 400);
      }
      
      // Update verification
      verification.status = 'APPROVED';
      verification.reviewedAt = new Date();
      verification.reviewedBy = adminId;
      
      await verification.save();
      
      // Update user
      const user = await User.findById(verification.user);
      user.isVerified = true;
      user.verificationStatus = 'APPROVED';
      await user.save();
      
      // TODO: Send notification to user
      
      logger.info(`Verification approved: ${verificationId} by admin: ${adminId}`);
      
      return verification;
    } catch (error) {
      logger.error('Approve verification error:', error);
      throw error;
    }
  }

  // Reject verification
  async rejectVerification(verificationId, adminId, rejectionReason) {
    try {
      const verification = await Verification.findById(verificationId);
      
      if (!verification) {
        throw new AppError('Verification request not found', 404);
      }
      
      if (verification.status !== 'PENDING') {
        throw new AppError(`Verification is already ${verification.status.toLowerCase()}`, 400);
      }
      
      // Update verification
      verification.status = 'REJECTED';
      verification.reviewedAt = new Date();
      verification.reviewedBy = adminId;
      verification.rejectionReason = rejectionReason;
      
      await verification.save();
      
      // Update user
      const user = await User.findById(verification.user);
      user.verificationStatus = 'REJECTED';
      await user.save();
      
      // TODO: Send notification to user
      
      logger.info(`Verification rejected: ${verificationId} by admin: ${adminId}`);
      
      return verification;
    } catch (error) {
      logger.error('Reject verification error:', error);
      throw error;
    }
  }

  // Get all pending verifications
  async getPendingVerifications(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [verifications, total] = await Promise.all([
        Verification.find({ status: 'PENDING' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'firstName lastName email username'),
        Verification.countDocuments({ status: 'PENDING' })
      ]);
      
      return {
        verifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get pending verifications error:', error);
      throw error;
    }
  }

  // Get verification by ID
  async getVerificationById(verificationId) {
    try {
      const verification = await Verification.findById(verificationId)
        .populate('user', 'firstName lastName email username avatar')
        .populate('reviewedBy', 'firstName lastName username');
      
      if (!verification) {
        throw new AppError('Verification not found', 404);
      }
      
      return verification;
    } catch (error) {
      logger.error('Get verification by ID error:', error);
      throw error;
    }
  }

  // Check if document number is already used
  async isDocumentNumberUsed(documentType, documentNumber, excludeUserId = null) {
    try {
      const query = {
        documentType,
        documentNumber,
        status: 'APPROVED'
      };
      
      if (excludeUserId) {
        query.user = { $ne: excludeUserId };
      }
      
      const verification = await Verification.findOne(query);
      
      return !!verification;
    } catch (error) {
      logger.error('Check document number error:', error);
      throw error;
    }
  }
}

export default new VerificationService();