import mongoose from 'mongoose';

const adImpressionSchema = new mongoose.Schema({
  advertisementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Device info
  userAgent: String,
  ipAddress: String,
  deviceType: {
    type: String,
    enum: ['DESKTOP', 'MOBILE', 'TABLET']
  },
  browser: String,
  os: String,
  screenSize: String,
  
  // Location
  country: String,
  region: String,
  city: String,
  latitude: Number,
  longitude: Number,
  
  // Context
  pageUrl: String,
  referrer: String,
  contentType: {
    type: String,
    enum: ['SOLUTION', 'JOB', 'MARKETPLACE', 'PROFILE', 'CHAT', 'SQUAD', 'KNOWLEDGE_HUB', 'LEADERBOARD', 'HOME', 'OTHER']
  },
  pageType: {
    type: String,
    enum: ['HOME', 'CATEGORY', 'DETAIL', 'LISTING', 'PROFILE', 'CHAT', 'ADMIN', 'OTHER']
  },
  
  // Ad position
  adPosition: {
    type: String,
    enum: ['TOP', 'MIDDLE', 'BOTTOM', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'IN_CONTENT', 'POPUP', 'NOTIFICATION']
  },
  
  // Interaction tracking
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  clickedAt: Date,
  convertedAt: Date,
  engagementDuration: Number, // in seconds
  
  // Performance metrics
  isViewable: {
    type: Boolean,
    default: false
  },
  viewableTime: Number, // seconds ad was viewable
  clickThroughRate: Number,
  
  // Cost
  cost: Number, // in kobo
  revenue: Number, // in kobo
  
  // Session info
  sessionId: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for performance
adImpressionSchema.index({ advertisementId: 1, viewedAt: -1 });
adImpressionSchema.index({ campaignId: 1, viewedAt: -1 });
adImpressionSchema.index({ userId: 1, viewedAt: -1 });
adImpressionSchema.index({ country: 1, viewedAt: -1 });
adImpressionSchema.index({ contentType: 1, viewedAt: -1 });
adImpressionSchema.index({ viewedAt: -1 });
adImpressionSchema.index({ clickedAt: -1 });
adImpressionSchema.index({ convertedAt: -1 });

// For analytics queries
adImpressionSchema.index({ 
  advertisementId: 1, 
  country: 1, 
  deviceType: 1, 
  viewedAt: -1 
});

export default mongoose.model('AdImpression', adImpressionSchema);