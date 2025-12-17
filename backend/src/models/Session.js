import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  device: {
    type: {
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'OTHER']
    },
    brand: String,
    model: String,
    os: String,
    osVersion: String,
    browser: String,
    browserVersion: String,
    screenResolution: String,
    language: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  pageCount: {
    type: Number,
    default: 0
  },
  eventCount: {
    type: Number,
    default: 0
  },
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  engaged: {
    type: Boolean,
    default: false
  },
  engagementScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ startTime: 1 });
sessionSchema.index({ 'location.country': 1, startTime: -1 });
sessionSchema.index({ 'device.type': 1, startTime: -1 });
sessionSchema.index({ active: 1, lastActivity: -1 });

sessionSchema.plugin(aggregatePaginate);

const Session = mongoose.model('Session', sessionSchema);

export default Session;