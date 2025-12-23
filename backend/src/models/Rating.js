import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  solution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxlength: [100, 'Pro cannot exceed 100 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [100, 'Con cannot exceed 100 characters']
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reportedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  authorResponse: {
    type: String,
    trim: true,
    maxlength: [1000, 'Author response cannot exceed 1000 characters']
  },
  authorRespondedAt: {
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

// Compound unique index - one rating per user per solution
ratingSchema.index({ solution: 1, user: 1 }, { unique: true });

// Indexes for better query performance
ratingSchema.index({ rating: 1 });
ratingSchema.index({ helpfulCount: -1 });
ratingSchema.index({ createdAt: -1 });
ratingSchema.index({ solution: 1, rating: 1 });

// Pre-save middleware
ratingSchema.pre('save', function(next) {
  // Mark as edited if updating
  if (this.isModified('rating') || this.isModified('comment') || 
      this.isModified('pros') || this.isModified('cons')) {
    this.isEdited = true;
  }
  
  // Set author responded timestamp
  if (this.isModified('authorResponse') && this.authorResponse) {
    this.authorRespondedAt = new Date();
  }
  
  next();
});

// Static methods
ratingSchema.statics.markHelpful = async function(ratingId, userId) {
  // Check if user has already marked helpful
  const rating = await this.findById(ratingId);
  
  // In a real app, you'd have a separate Helpful model to track who marked what
  // For simplicity, we just increment
  rating.helpfulCount += 1;
  return rating.save();
};

ratingSchema.statics.report = async function(ratingId) {
  return this.findByIdAndUpdate(
    ratingId,
    { $inc: { reportedCount: 1 } },
    { new: true }
  );
};

// Instance methods
ratingSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.user.toString() === userId.toString();
};

ratingSchema.methods.canDelete = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.user.toString() === userId.toString();
};

ratingSchema.methods.canRespond = function(solutionAuthorId) {
  return solutionAuthorId.toString() === this.solution.author.toString();
};

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;