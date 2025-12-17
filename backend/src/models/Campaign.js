import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const campaignTargetingSchema = new mongoose.Schema({
  countries: [String],
  languages: [String],
  subscriptionTiers: [{
    type: String,
    enum: ['FREE', 'BASE', 'MID', 'TOP']
  }],
  userRoles: [{
    type: String,
    enum: ['USER', 'SOLUTION_PROVIDER', 'EMPLOYER', 'ADVERTISER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
  }],
  categories: [String],
  techStack: [String],
  employmentStatus: [{
    type: String,
    enum: ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED']
  }],
  minRating: Number,
  isVerified: Boolean,
  customFilters: mongoose.Schema.Types.Mixed
}, { _id: false });

const campaignPerformanceSchema = new mongoose.Schema({
  totalImpressions: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  totalConversions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  goalProgress: {
    type: Number,
    default: 0
  },
  efficiencyScore: {
    type: Number,
    default: 0
  },
  timeline: [{
    date: Date,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spent: Number,
    _id: false
  }]
}, { _id: false });

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  advertiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  
  // Budget
  budgetType: {
    type: String,
    enum: ['DAILY', 'TOTAL', 'LIFETIME'],
    required: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 1
  },
  dailyBudget: Number,
  spentAmount: {
    type: Number,
    default: 0
  },
  
  // Goals
  goalType: {
    type: String,
    enum: ['IMPRESSIONS', 'CLICKS', 'CONVERSIONS', 'LEADS', 'SALES', 'ENGAGEMENT', 'AWARENESS'],
    required: true
  },
  goalValue: {
    type: Number,
    required: true,
    min: 1
  },
  currentGoalProgress: {
    type: Number,
    default: 0
  },
  
  // Targeting
  targeting: campaignTargetingSchema,
  
  // Schedule
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Performance
  performance: campaignPerformanceSchema,
  
  // Metadata
  tags: [String],
  notes: String,
  
  // Approval
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date,
  completedAt: Date
});

campaignSchema.plugin(mongooseAggregatePaginate);

campaignSchema.index({ advertiserId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ startDate: 1, endDate: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ 'targeting.categories': 1 });
campaignSchema.index({ 'targeting.subscriptionTiers': 1 });

campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto update status based on dates and budget
  const now = new Date();
  
  if (this.endDate && now > this.endDate) {
    this.status = 'COMPLETED';
    this.completedAt = now;
  } else if (this.startDate && now >= this.startDate && this.status === 'DRAFT') {
    this.status = 'ACTIVE';
    this.activatedAt = now;
  }
  
  // Check budget limits
  if (this.dailyBudget && this.spentAmount >= this.dailyBudget) {
    this.status = 'PAUSED';
  }
  
  if (this.totalBudget && this.spentAmount >= this.totalBudget) {
    this.status = 'COMPLETED';
    this.completedAt = now;
  }
  
  next();
});

campaignSchema.virtual('remainingBudget').get(function() {
  return this.totalBudget - (this.spentAmount || 0);
});

campaignSchema.virtual('goalCompletion').get(function() {
  if (!this.goalValue || this.goalValue === 0) return 0;
  return ((this.currentGoalProgress || 0) / this.goalValue) * 100;
});

campaignSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

export default mongoose.model('Campaign', campaignSchema);