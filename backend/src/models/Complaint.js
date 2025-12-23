import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  solution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution',
    required: true,
    index: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'SPAM',
      'INAPPROPRIATE_CONTENT',
      'COPYRIGHT_VIOLATION',
      'MISLEADING_INFORMATION',
      'BROKEN_LINKS',
      'SECURITY_CONCERN',
      'OTHER'
    ],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  evidence: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
    default: 'PENDING',
    index: true
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate complaints
complaintSchema.index({ solution: 1, reporter: 1 }, { unique: true });

// Indexes for better query performance
complaintSchema.index({ status: 1 });
complaintSchema.index({ type: 1 });
complaintSchema.index({ createdAt: -1 });

// Pre-save middleware
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'RESOLVED' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// Static methods
complaintSchema.statics.getStats = async function(solutionId = null) {
  const match = solutionId ? { solution: solutionId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    underReview: 0,
    resolved: 0,
    dismissed: 0,
    byType: {}
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result[stat.status.toLowerCase()] = stat.count;
  });
  
  return result;
};

complaintSchema.statics.resolveAllForSolution = async function(solutionId, adminId, notes = '') {
  return this.updateMany(
    { solution: solutionId, status: { $in: ['PENDING', 'UNDER_REVIEW'] } },
    {
      status: 'RESOLVED',
      resolvedBy: adminId,
      resolvedAt: new Date(),
      adminNotes: notes
    }
  );
};

// Instance methods
complaintSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.reporter.toString() === userId.toString() && this.status === 'PENDING';
};

complaintSchema.methods.canDelete = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.reporter.toString() === userId.toString() && this.status === 'PENDING';
};

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;