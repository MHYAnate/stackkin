import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'PAGE_VIEW', 'BUTTON_CLICK', 'FORM_SUBMIT', 'SEARCH', 'FILTER', 'SORT',
      'DOWNLOAD', 'SHARE', 'LIKE', 'COMMENT', 'RATING', 'PURCHASE',
      'SUBSCRIPTION', 'REGISTRATION', 'LOGIN', 'LOGOUT', 'ERROR', 'CUSTOM'
    ],
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  page: {
    type: String,
    index: true
  },
  referrer: String,
  userAgent: String,
  ipAddress: String,
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
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
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for common queries
eventSchema.index({ userId: 1, type: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, timestamp: -1 });
eventSchema.index({ type: 1, timestamp: -1 });
eventSchema.index({ page: 1, timestamp: -1 });
eventSchema.index({ 'properties.action': 1, timestamp: -1 });

eventSchema.plugin(aggregatePaginate);

const Event = mongoose.model('Event', eventSchema);

export default Event;