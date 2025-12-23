import Solution from '../../models/Solution.js';
import Category from '../../models/Category.js';
import Rating from '../../models/Rating.js';
import Complaint from '../../models/Complaint.js';
import User from '../../models/User.js';
import { AppError, ValidationError, NotFoundError } from '../../errors/index.js';
import logger from '../../config/logger.js';
import { getRedisClient } from '../../config/redis.js';
import { solutionService, ratingService, complaintService, categoryService } from '../solution/index.js';
import emailService from '../notification/email.service.js';

class SolutionManagementService {
  constructor() {
    this.redis = getRedisClient();
  }

  // Get moderation queue
  async getModerationQueue(type = 'PENDING_REVIEW') {
    try {
      const cacheKey = `moderation:queue:${type}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      let query = {};
      
      switch (type) {
        case 'PENDING_REVIEW':
          query = { status: 'PENDING_REVIEW' };
          break;
        case 'REPORTED':
          query = { complaintsCount: { $gt: 0 } };
          break;
        case 'QUALITY_CHECK':
          query = { 
            $or: [
              { averageRating: { $lt: 3 } },
              { complaintsCount: { $gt: 2 } }
            ]
          };
          break;
        case 'SUSPENDED_REVIEW':
          query = { status: 'SUSPENDED' };
          break;
        default:
          query = {};
      }

      const solutions = await Solution.find(query)
        .populate('author', 'firstName lastName username email')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(100);

      const queue = {
        id: type,
        type,
        solutions,
        count: solutions.length,
        estimatedTime: solutions.length * 5, // 5 minutes per solution
        priority: this.getQueuePriority(type),
        urgent: solutions.some(s => s.complaintsCount > 5),
        status: 'PENDING',
        processed: 0,
        remaining: solutions.length,
        assignedTo: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.redis.setex(cacheKey, 60, JSON.stringify(queue)); // 1 minute cache
      return queue;
    } catch (error) {
      logger.error('Get moderation queue error:', error);
      throw error;
    }
  }

  // Get solution reports
  async getSolutionReports(filter = {}, pagination = {}) {
    try {
      const cacheKey = `solution:reports:${JSON.stringify(filter)}:${JSON.stringify(pagination)}`;
      
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};
      
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.reason) {
        query.type = filter.reason;
      }
      
      if (filter.severity) {
        // In a real app, you'd have a severity field
        // For now, we'll filter by complaint type
        query.type = filter.severity;
      }

      const [complaints, totalCount] = await Promise.all([
        Complaint.find(query)
          .populate('solution', 'title slug')
          .populate('reporter', 'firstName lastName username')
          .populate('resolvedBy', 'firstName lastName username')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Complaint.countDocuments(query)
      ]);

      const result = {
        edges: complaints.map(complaint => ({
          node: complaint,
          cursor: complaint._id.toString()
        })),
        pageInfo: {
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
          startCursor: complaints[0]?._id.toString(),
          endCursor: complaints[complaints.length - 1]?._id.toString()
        },
        totalCount
      };

      await this.redis.setex(cacheKey, 60, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Get solution reports error:', error);
      throw error;
    }
  }

  // Perform bulk actions
  async performBulkAction(input) {
    try {
      const { solutionIds, action, reason, notes, notifyUsers, notificationTemplate } = input;
      
      const actionId = `bulk_${action}_${Date.now()}`;
      
      // Start bulk action
      const bulkActionResult = {
        id: actionId,
        action,
        totalSolutions: solutionIds.length,
        processed: 0,
        successful: 0,
        failed: 0,
        reason,
        notes,
        changes: null,
        results: [],
        errors: [],
        status: 'PROCESSING',
        startedAt: new Date(),
        completedAt: null,
        duration: null
      };

      // Store in cache for tracking
      await this.redis.setex(
        `bulk:action:${actionId}`,
        3600,
        JSON.stringify(bulkActionResult)
      );

      // Process in background
      this.processBulkActionBackground(bulkActionResult, solutionIds, action, reason, notifyUsers);

      return bulkActionResult;
    } catch (error) {
      logger.error('Perform bulk action error:', error);
      throw error;
    }
  }

  // Process bulk action in background
  async processBulkActionBackground(result, solutionIds, action, reason, notifyUsers) {
    try {
      const results = [];
      const errors = [];
      
      for (const solutionId of solutionIds) {
        try {
          const solution = await Solution.findById(solutionId);
          
          if (!solution) {
            errors.push({
              solutionId,
              error: 'Solution not found',
              timestamp: new Date()
            });
            continue;
          }

          let updateData = {};
          let success = false;
          
          switch (action) {
            case 'APPROVE':
              if (solution.status !== 'PUBLISHED') {
                updateData = { status: 'PUBLISHED' };
                success = true;
              }
              break;
            case 'REJECT':
              updateData = { status: 'REJECTED' };
              success = true;
              break;
            case 'SUSPEND':
              updateData = { status: 'SUSPENDED' };
              success = true;
              break;
            case 'UNSUSPEND':
              if (solution.status === 'SUSPENDED') {
                updateData = { status: 'PUBLISHED' };
                success = true;
              }
              break;
            case 'FEATURE':
              updateData = { isFeatured: true };
              success = true;
              break;
            case 'UNFEATURE':
              updateData = { isFeatured: false };
              success = true;
              break;
            case 'PIN':
              updateData = { isPinned: true };
              success = true;
              break;
            case 'UNPIN':
              updateData = { isPinned: false };
              success = true;
              break;
            case 'ARCHIVE':
              updateData = { status: 'ARCHIVED' };
              success = true;
              break;
            case 'DELETE':
              // Soft delete
              updateData = { status: 'ARCHIVED' };
              success = true;
              break;
            default:
              errors.push({
                solutionId,
                error: `Unknown action: ${action}`,
                timestamp: new Date()
              });
              continue;
          }
          
          if (success) {
            await Solution.findByIdAndUpdate(solutionId, updateData);
            
            results.push({
              solutionId,
              success: true,
              message: `Solution ${action.toLowerCase()} successfully`,
              details: { action, updateData }
            });
            
            // Notify user if requested
            if (notifyUsers && solution.author) {
              await this.notifySolutionOwner(
                solutionId,
                solution.author,
                action,
                reason
              ).catch(err => {
                logger.error(`Failed to notify solution owner ${solution.author}:`, err);
              });
            }
          } else {
            errors.push({
              solutionId,
              error: `Cannot ${action.toLowerCase()} solution in current state`,
              timestamp: new Date()
            });
          }
          
        } catch (error) {
          errors.push({
            solutionId,
            error: error.message,
            timestamp: new Date()
          });
        }
        
        // Update progress
        result.processed += 1;
        result.successful = results.length;
        result.failed = errors.length;
        
        // Update cache
        await this.redis.setex(
          `bulk:action:${result.id}`,
          3600,
          JSON.stringify({ ...result, results, errors })
        );
      }
      
      // Mark as completed
      result.status = 'COMPLETED';
      result.completedAt = new Date();
      result.duration = result.completedAt - result.startedAt;
      result.results = results;
      result.errors = errors;
      
      await this.redis.setex(
        `bulk:action:${result.id}`,
        3600,
        JSON.stringify(result)
      );
      
      logger.info(`Bulk action completed: ${result.id}, successful: ${result.successful}, failed: ${result.failed}`);
      
    } catch (error) {
      logger.error('Process bulk action background error:', error);
      
      // Update error state
      result.status = 'FAILED';
      result.completedAt = new Date();
      result.duration = result.completedAt - result.startedAt;
      result.errors.push({
        error: `Processing error: ${error.message}`,
        timestamp: new Date()
      });
      
      await this.redis.setex(
        `bulk:action:${result.id}`,
        3600,
        JSON.stringify(result)
      );
    }
  }

  // Get bulk action result
  async getBulkActionResult(actionId) {
    try {
      const cached = await this.redis.get(`bulk:action:${actionId}`);
      if (!cached) {
        throw new NotFoundError('Bulk action not found or expired');
      }
      
      return JSON.parse(cached);
    } catch (error) {
      logger.error('Get bulk action result error:', error);
      throw error;
    }
  }

  // Export solutions
  async exportSolutions(input) {
    try {
      const { filter, fields, format = 'CSV', includeContent = false } = input;
      
      const exportId = `export_${Date.now()}`;
      
      const exportData = {
        id: exportId,
        requestedBy: null, // Would be set by resolver
        filter,
        fields,
        format,
        includeContent,
        status: 'PENDING',
        progress: 0,
        recordCount: 0,
        fileUrl: null,
        fileSize: 0,
        checksum: null,
        error: null,
        requestedAt: new Date(),
        startedAt: null,
        completedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      // Store in cache
      await this.redis.setex(
        `export:${exportId}`,
        24 * 60 * 60,
        JSON.stringify(exportData)
      );
      
      // Start export in background
      this.processExportBackground(exportData);
      
      return exportData;
    } catch (error) {
      logger.error('Export solutions error:', error);
      throw error;
    }
  }

  // Process export in background
  async processExportBackground(exportData) {
    try {
      exportData.status = 'PROCESSING';
      exportData.startedAt = new Date();
      
      await this.redis.setex(
        `export:${exportData.id}`,
        24 * 60 * 60,
        JSON.stringify(exportData)
      );
      
      // Get solutions based on filter
      const query = this.buildExportQuery(exportData.filter);
      const solutions = await Solution.find(query)
        .populate('author', 'firstName lastName username email')
        .populate('category', 'name slug')
        .lean();
      
      exportData.recordCount = solutions.length;
      exportData.progress = 50;
      
      await this.redis.setex(
        `export:${exportData.id}`,
        24 * 60 * 60,
        JSON.stringify(exportData)
      );
      
      // Process and create export file
      const exportFile = await this.createExportFile(solutions, exportData);
      
      exportData.fileUrl = exportFile.url;
      exportData.fileSize = exportFile.size;
      exportData.checksum = exportFile.checksum;
      exportData.progress = 100;
      exportData.status = 'COMPLETED';
      exportData.completedAt = new Date();
      
      await this.redis.setex(
        `export:${exportData.id}`,
        24 * 60 * 60,
        JSON.stringify(exportData)
      );
      
      logger.info(`Export completed: ${exportData.id}, records: ${solutions.length}`);
      
    } catch (error) {
      logger.error('Process export background error:', error);
      
      exportData.status = 'FAILED';
      exportData.error = error.message;
      exportData.completedAt = new Date();
      
      await this.redis.setex(
        `export:${exportData.id}`,
        24 * 60 * 60,
        JSON.stringify(exportData)
      );
    }
  }

  // Build export query from filter
  buildExportQuery(filter) {
    const query = {};
    
    if (!filter) return query;
    
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } }
      ];
    }
    
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.category) {
      query.category = filter.category;
    }
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.isPremium !== undefined) {
      query.isPremium = filter.isPremium;
    }
    
    if (filter.isFeatured !== undefined) {
      query.isFeatured = filter.isFeatured;
    }
    
    if (filter.createdFrom) {
      query.createdAt = { $gte: new Date(filter.createdFrom) };
    }
    
    if (filter.createdTo) {
      if (!query.createdAt) query.createdAt = {};
      query.createdAt.$lte = new Date(filter.createdTo);
    }
    
    return query;
  }

  // Create export file
  async createExportFile(solutions, exportData) {
    // In a real app, you'd create actual CSV/JSON/Excel file
    // For now, return mock data
    
    // Simulate file creation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      url: `/exports/${exportData.id}.${exportData.format.toLowerCase()}`,
      size: solutions.length * 1000, // Approximate size
      checksum: `sha256_${exportData.id}`
    };
  }

  // Notify solution owner
  async notifySolutionOwner(solutionId, userId, action, reason) {
    try {
      const solution = await Solution.findById(solutionId);
      const user = await User.findById(userId);
      
      if (!solution || !user || !user.email) {
        return;
      }
      
      const subject = `Your solution "${solution.title}" has been ${action.toLowerCase()}`;
      const message = reason 
        ? `Your solution has been ${action.toLowerCase()} for the following reason: ${reason}`
        : `Your solution has been ${action.toLowerCase()}`;
      
      await emailService.sendSolutionModerationNotification(
        user.email,
        user.firstName,
        solution,
        action,
        reason
      );
      
      logger.info(`Solution moderation notification sent to ${user.email}, solution: ${solutionId}, action: ${action}`);
    } catch (error) {
      logger.error('Notify solution owner error:', error);
      throw error;
    }
  }

  // Helper methods
  getQueuePriority(type) {
    const priorities = {
      'PENDING_REVIEW': 'MEDIUM',
      'REPORTED': 'HIGH',
      'QUALITY_CHECK': 'LOW',
      'SUSPENDED_REVIEW': 'MEDIUM'
    };
    
    return priorities[type] || 'LOW';
  }

  // Cache clearing methods
  async clearModerationCache() {
    const keys = await this.redis.keys('moderation:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async clearExportCache(exportId) {
    await this.redis.del(`export:${exportId}`);
  }
}

export default new SolutionManagementService();