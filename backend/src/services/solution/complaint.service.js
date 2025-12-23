import Complaint from '../../models/Complaint.js';
import Solution from '../../models/Solution.js';
import User from '../../models/User.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';
import emailService from '../notification/email.service.js';

class ComplaintService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Submit complaint
  async submitComplaint(data, userId) {
    try {
      // Check if solution exists
      const solution = await Solution.findById(data.solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      // Check if user has already complained about this solution
      const existingComplaint = await Complaint.findOne({
        solution: data.solutionId,
        reporter: userId
      });

      if (existingComplaint) {
        throw new ValidationError('You have already submitted a complaint for this solution');
      }

      // Create complaint
      const complaint = new Complaint({
        solution: data.solutionId,
        reporter: userId,
        type: data.type,
        description: data.description,
        evidence: data.evidence || []
      });

      await complaint.save();

      // Update solution complaint count
      await Solution.findByIdAndUpdate(data.solutionId, {
        $inc: { complaintsCount: 1 }
      });

      // Notify admins (in production, this would be async via queue)
      await this.notifyAdmins(complaint);

      // Clear cache
      await this.clearComplaintCache(data.solutionId);

      logger.info(`Complaint submitted: ${complaint._id} for solution: ${data.solutionId} by user: ${userId}`);
      return complaint;
    } catch (error) {
      logger.error('Submit complaint error:', error);
      throw error;
    }
  }

  // Get complaints for solution
  async getSolutionComplaints(solutionId, includeResolved = false) {
    try {
      const cacheKey = `complaints:solution:${solutionId}:${includeResolved}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = { solution: solutionId };
      if (!includeResolved) {
        query.status = { $ne: 'RESOLVED' };
      }

      const complaints = await Complaint.find(query)
        .populate('reporter', 'firstName lastName username')
        .sort({ createdAt: -1 });

      await this.redis.setex(cacheKey, 300, JSON.stringify(complaints));
      return complaints;
    } catch (error) {
      logger.error('Get solution complaints error:', error);
      throw error;
    }
  }

  // Get complaint by ID
  async getComplaintById(complaintId) {
    try {
      const cacheKey = `complaint:${complaintId}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const complaint = await Complaint.findById(complaintId)
        .populate('solution', 'title slug author')
        .populate('reporter', 'firstName lastName username email')
        .populate('resolvedBy', 'firstName lastName username');

      if (!complaint) {
        throw new NotFoundError('Complaint not found');
      }

      await this.redis.setex(cacheKey, 300, JSON.stringify(complaint));
      return complaint;
    } catch (error) {
      logger.error('Get complaint by ID error:', error);
      throw error;
    }
  }

  // Update complaint status (admin only)
  async updateComplaintStatus(complaintId, status, adminId, notes = '') {
    try {
      const complaint = await Complaint.findById(complaintId);
      
      if (!complaint) {
        throw new NotFoundError('Complaint not found');
      }

      if (complaint.status === 'RESOLVED') {
        throw new ValidationError('Cannot update a resolved complaint');
      }

      complaint.status = status;
      complaint.adminNotes = notes;
      
      if (status === 'RESOLVED') {
        complaint.resolvedBy = adminId;
        complaint.resolvedAt = new Date();
        
        // Decrement solution complaint count
        await Solution.findByIdAndUpdate(complaint.solution, {
          $inc: { complaintsCount: -1 }
        });
      }

      await complaint.save();

      // Notify reporter
      await this.notifyReporter(complaint, status);

      // Clear cache
      await this.clearComplaintCache(complaint.solution);

      logger.info(`Complaint status updated: ${complaintId} to ${status} by admin: ${adminId}`);
      return complaint;
    } catch (error) {
      logger.error('Update complaint status error:', error);
      throw error;
    }
  }

  // Get complaint stats
  async getComplaintStats(solutionId = null) {
    try {
      const cacheKey = `complaints:stats:${solutionId || 'global'}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const stats = await Complaint.getStats(solutionId);
      
      await this.redis.setex(cacheKey, 600, JSON.stringify(stats));
      return stats;
    } catch (error) {
      logger.error('Get complaint stats error:', error);
      throw error;
    }
  }

  // Resolve all complaints for solution (admin only)
  async resolveAllForSolution(solutionId, adminId, notes = '') {
    try {
      const solution = await Solution.findById(solutionId);
      if (!solution) {
        throw new NotFoundError('Solution not found');
      }

      const result = await Complaint.resolveAllForSolution(solutionId, adminId, notes);

      // Reset solution complaint count
      solution.complaintsCount = 0;
      await solution.save();

      // Clear cache
      await this.clearComplaintCache(solutionId);

      logger.info(`All complaints resolved for solution: ${solutionId} by admin: ${adminId}`);
      return result;
    } catch (error) {
      logger.error('Resolve all complaints error:', error);
      throw error;
    }
  }

  // Helper method to notify admins
  async notifyAdmins(complaint) {
    try {
      // Get admin users
      const admins = await User.find({
        role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
        emailNotifications: true
      });

      // Send email to each admin
      for (const admin of admins) {
        await emailService.sendComplaintNotification(
          admin.email,
          admin.firstName,
          complaint
        ).catch(err => {
          logger.error(`Failed to send complaint notification to admin ${admin.email}:`, err);
        });
      }

      logger.info(`Complaint notifications sent to ${admins.length} admins`);
    } catch (error) {
      logger.error('Notify admins error:', error);
      // Don't throw error, just log it
    }
  }

  // Helper method to notify reporter
  async notifyReporter(complaint, status) {
    try {
      const reporter = await User.findById(complaint.reporter);
      if (!reporter || !reporter.emailNotifications) {
        return;
      }

      await emailService.sendComplaintStatusUpdate(
        reporter.email,
        reporter.firstName,
        complaint,
        status
      );

      logger.info(`Complaint status update sent to reporter: ${reporter.email}`);
    } catch (error) {
      logger.error('Notify reporter error:', error);
      // Don't throw error, just log it
    }
  }

  // Cache clearing methods
  async clearComplaintCache(solutionId) {
    const keys = await this.redis.keys(`complaints:*${solutionId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export default new ComplaintService();