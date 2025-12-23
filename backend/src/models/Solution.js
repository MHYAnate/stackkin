import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import slugify from 'slugify';

const solutionSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  
  // Classification
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  type: {
    type: String,
    enum: [
      'APPLICATION',
      'DEV_TOOL',
      'INTEGRATION',
      'TUTORIAL',
      'LIBRARY',
      'FRAMEWORK',
      'API',
      'PLUGIN',
      'TEMPLATE',
      'BOUNTY',
      'OTHER'
    ],
    required: true,
    index: true
  },
  techStack: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  useCases: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  features: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  
  // Links & URLs
  documentationUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Documentation URL must be a valid URL'
    }
  },
  demoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Demo URL must be a valid URL'
    }
  },
  repositoryUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Repository URL must be a valid URL'
    }
  },
  websiteUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website URL must be a valid URL'
    }
  },
  videoUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Video URL must be a valid URL'
    }
  },
  
  // Media
  images: [{
    type: String,
    trim: true
  }],
  thumbnailImage: {
    type: String,
    trim: true
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contact & Pricing
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  contactPhone: {
    type: String,
    trim: true
  },
  pricingModel: {
    type: String,
    enum: [
      'FREE',
      'FREEMIUM',
      'PAID',
      'SUBSCRIPTION',
      'ONE_TIME',
      'CONTACT_FOR_PRICING'
    ],
    required: true,
    index: true
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'EUR', 'GBP']
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Status & Settings
  status: {
    type: String,
    enum: [
      'DRAFT',
      'PENDING_REVIEW',
      'PUBLISHED',
      'REJECTED',
      'ARCHIVED',
      'SUSPENDED'
    ],
    default: 'DRAFT',
    index: true
  },
  visibility: {
    type: String,
    enum: ['PUBLIC', 'UNLISTED', 'PRIVATE'],
    default: 'PUBLIC',
    index: true
  },
  isPremium: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  isTopRated: {
    type: Boolean,
    default: false,
    index: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowRatings: {
    type: Boolean,
    default: true
  },
  
  // Stats & Counters
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  saves: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Ratings Summary
  ratingsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingBreakdown: {
    fiveStars: { type: Number, default: 0 },
    fourStars: { type: Number, default: 0 },
    threeStars: { type: Number, default: 0 },
    twoStars: { type: Number, default: 0 },
    oneStar: { type: Number, default: 0 }
  },
  
  // Moderation
  complaintsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Timestamps
  publishedAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
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

// Indexes for better query performance
solutionSchema.index({ title: 'text', description: 'text', shortDescription: 'text' });
solutionSchema.index({ author: 1, createdAt: -1 });
solutionSchema.index({ category: 1, averageRating: -1 });
solutionSchema.index({ techStack: 1 });
solutionSchema.index({ tags: 1 });
solutionSchema.index({ status: 1, visibility: 1, isPremium: 1 });

// Virtual for ratings
solutionSchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'solution',
  justOne: false
});

// Virtual for complaints
solutionSchema.virtual('complaints', {
  ref: 'Complaint',
  localField: '_id',
  foreignField: 'solution',
  justOne: false,
  match: { status: { $ne: 'RESOLVED' } }
});

// Pre-save middleware
solutionSchema.pre('save', function(next) {
  // Generate slug from title
  if (this.isModified('title') && !this.slug) {
    const timestamp = Date.now();
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${timestamp.toString().slice(-6)}`;
  }
  
  // Set publishedAt if status changes to PUBLISHED
  if (this.isModified('status') && this.status === 'PUBLISHED' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update lastActivityAt on any modification
  if (this.isModified()) {
    this.lastActivityAt = new Date();
  }
  
  // Set thumbnail if images exist
  if (this.isModified('images') && this.images.length > 0 && !this.thumbnailImage) {
    this.thumbnailImage = this.images[0];
  }
  
  next();
});

// Pre-remove middleware
solutionSchema.pre('remove', async function(next) {
  // Remove associated ratings and complaints
  const Rating = mongoose.model('Rating');
  const Complaint = mongoose.model('Complaint');
  
  await Promise.all([
    Rating.deleteMany({ solution: this._id }),
    Complaint.deleteMany({ solution: this._id })
  ]);
  
  next();
});

// Static methods
solutionSchema.statics.incrementViews = async function(solutionId) {
  return this.findByIdAndUpdate(
    solutionId,
    { 
      $inc: { views: 1 },
      $set: { lastActivityAt: new Date() }
    },
    { new: true }
  );
};

solutionSchema.statics.incrementSaves = async function(solutionId) {
  return this.findByIdAndUpdate(
    solutionId,
    { $inc: { saves: 1 } },
    { new: true }
  );
};

solutionSchema.statics.incrementShares = async function(solutionId) {
  return this.findByIdAndUpdate(
    solutionId,
    { $inc: { shares: 1 } },
    { new: true }
  );
};

solutionSchema.statics.updateRatingStats = async function(solutionId) {
  const Rating = mongoose.model('Rating');
  
  const stats = await Rating.aggregate([
    { $match: { solution: solutionId } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const breakdown = { fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStar: 0 };
  let totalRatings = 0;
  let totalScore = 0;
  
  stats.forEach(stat => {
    const rating = stat._id;
    const count = stat.count;
    
    if (rating >= 4.5) breakdown.fiveStars += count;
    else if (rating >= 3.5) breakdown.fourStars += count;
    else if (rating >= 2.5) breakdown.threeStars += count;
    else if (rating >= 1.5) breakdown.twoStars += count;
    else breakdown.oneStar += count;
    
    totalRatings += count;
    totalScore += rating * count;
  });
  
  const averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;
  const isTopRated = averageRating >= 4.5 && totalRatings >= 10;
  
  return this.findByIdAndUpdate(
    solutionId,
    {
      ratingsCount: totalRatings,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingBreakdown: breakdown,
      isTopRated,
      lastActivityAt: new Date()
    },
    { new: true }
  );
};

// Instance methods
solutionSchema.methods.isOwner = function(userId) {
  return this.author.toString() === userId.toString();
};

solutionSchema.methods.canView = function(userId) {
  if (this.visibility === 'PUBLIC') return true;
  if (this.visibility === 'UNLISTED') return true; // Can view with link
  if (this.visibility === 'PRIVATE') return this.isOwner(userId);
  return false;
};

solutionSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.isOwner(userId) && this.status !== 'ARCHIVED';
};

solutionSchema.methods.canDelete = function(userId, userRole) {
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
  return this.isOwner(userId) && this.status !== 'ARCHIVED';
};

// Apply aggregate paginate plugin
solutionSchema.plugin(mongooseAggregatePaginate);

const Solution = mongoose.model('Solution', solutionSchema);

export default Solution;