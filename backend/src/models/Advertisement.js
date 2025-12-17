import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const targetingSchema = new mongoose.Schema({
  demographics: {
    ageRanges: [{
      type: String,
      enum: ['UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_54', 'AGE_55_PLUS']
    }],
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']
    },
    languages: [String],
    educationLevels: [{
      type: String,
      enum: ['HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE']
    }],
    employmentStatus: [{
      type: String,
      enum: ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED']
    }],
    incomeRanges: [{
      type: String,
      enum: ['UNDER_20K', 'AGE_20K_40K', 'AGE_40K_60K', 'AGE_60K_80K', 'AGE_80K_100K', 'OVER_100K']
    }]
  },
  geography: {
    countries: [String],
    regions: [String],
    cities: [String],
    postalCodes: [String],
    radius: {
      latitude: Number,
      longitude: Number,
      radiusKm: Number
    },
    customAreas: mongoose.Schema.Types.Mixed
  },
  behavior: {
    interests: [String],
    behaviors: [{
      type: String,
      enum: ['SOLUTION_CREATOR', 'JOB_POSTER', 'MARKETPLACE_BUYER', 'MARKETPLACE_SELLER', 'FREQUENT_CHATTER', 'PREMIUM_USER', 'VERIFIED_USER', 'NEW_USER', 'RETURNING_USER', 'POWER_USER']
    }],
    engagementLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']
    },
    purchaseIntent: {
      type: String,
      enum: ['RESEARCHING', 'COMPARING', 'READY_TO_BUY', 'JUST_BROWSING']
    },
    customSegments: [String]
  },
  contextual: {
    categories: [String],
    keywords: [String],
    contentTypes: [{
      type: String,
      enum: ['SOLUTION', 'JOB', 'MARKETPLACE', 'PROFILE', 'CHAT', 'SQUAD', 'KNOWLEDGE_HUB', 'LEADERBOARD']
    }],
    pageTypes: [{
      type: String,
      enum: ['HOME', 'CATEGORY', 'DETAIL', 'LISTING', 'PROFILE', 'CHAT', 'ADMIN']
    }],
    placementPositions: [{
      type: String,
      enum: ['TOP', 'MIDDLE', 'BOTTOM', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'IN_CONTENT', 'POPUP', 'NOTIFICATION']
    }]
  },
  device: {
    deviceTypes: [{
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'ALL']
    }],
    operatingSystems: [String],
    browsers: [String],
    screenSizes: [{
      type: String,
      enum: ['MOBILE_SMALL', 'MOBILE_LARGE', 'TABLET', 'DESKTOP_SMALL', 'DESKTOP_LARGE']
    }],
    connectionTypes: [{
      type: String,
      enum: ['WIFI', 'MOBILE_4G', 'MOBILE_3G', 'MOBILE_2G', 'ETHERNET']
    }]
  },
  schedule: {
    daysOfWeek: [{
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    }],
    hoursOfDay: [Number], // 0-23
    timezone: String,
    blackoutDates: [Date]
  }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  startTime: String, // "09:00"
  endTime: String,   // "17:00"
  days: [{
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  }],
  timezone: String
}, { _id: false });

const adPerformanceSchema = new mongoose.Schema({
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  engagements: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  relevanceScore: {
    type: Number,
    default: 0
  },
  hourlyMetrics: [{
    hour: Number,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    ctr: Number,
    _id: false
  }],
  dailyMetrics: [{
    date: Date,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spent: Number,
    ctr: Number,
    _id: false
  }],
  weeklyMetrics: [{
    week: Number,
    year: Number,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spent: Number,
    _id: false
  }],
  lastUpdated: Date
}, { _id: false });

const advertisementSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['BANNER', 'INTERSTITIAL', 'NATIVE', 'VIDEO', 'CAROUSEL', 'POPUP', 'SIDEBAR', 'IN_FEED'],
    required: true
  },
  format: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'HTML', 'TEXT', 'RICH_MEDIA'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  
  // Creative
  title: {
    type: String,
    required: true
  },
  description: String,
  imageUrl: String,
  videoUrl: String,
  thumbnailUrl: String,
  htmlContent: String,
  callToAction: {
    type: String,
    required: true
  },
  destinationUrl: {
    type: String,
    required: true
  },
  
  // Targeting
  targeting: targetingSchema,
  approvedTargeting: targetingSchema,
  
  // Scheduling
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  schedule: scheduleSchema,
  approvedSchedule: scheduleSchema,
  
  // Bidding & Budget
  biddingType: {
    type: String,
    enum: ['CPC', 'CPM', 'CPA', 'CPE', 'FIXED'],
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 1
  },
  dailyBudget: Number,
  totalBudget: Number,
  spentAmount: {
    type: Number,
    default: 0
  },
  
  // Performance
  performance: adPerformanceSchema,
  
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
  rejectionReason: String,
  
  // Metadata
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed,
  
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
  pausedAt: Date,
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

advertisementSchema.plugin(mongooseAggregatePaginate);

advertisementSchema.index({ campaignId: 1 });
advertisementSchema.index({ status: 1 });
advertisementSchema.index({ createdBy: 1 });
advertisementSchema.index({ startDate: 1, endDate: 1 });
advertisementSchema.index({ tags: 1 });
advertisementSchema.index({ 'targeting.geography.countries': 1 });
advertisementSchema.index({ 'targeting.contextual.categories': 1 });

advertisementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto update status based on dates
  if (this.startDate && this.endDate) {
    const now = new Date();
    if (now > this.endDate) {
      this.status = 'EXPIRED';
    } else if (now >= this.startDate && now <= this.endDate && this.status === 'DRAFT') {
      this.status = 'PENDING_APPROVAL';
    }
  }
  
  next();
});

export default mongoose.model('Advertisement', advertisementSchema);