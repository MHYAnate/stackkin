import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  queryHash: {
    type: String,
    index: true
  },
  period: {
    type: String,
    enum: [
      'TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS',
      'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER',
      'THIS_YEAR', 'LAST_YEAR', 'CUSTOM', 'ALL_TIME'
    ]
  },
  startDate: Date,
  endDate: Date,
  metrics: [String],
  dimensions: [String],
  groupBy: {
    type: String,
    enum: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CATEGORY', 'TIER', 'COUNTRY', 'DEVICE', 'SOURCE']
  },
  ttl: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  expiresAt: {
    type: Date,
    index: true,
    expires: 0
  },
  hits: {
    type: Number,
    default: 0
  },
  lastHit: Date,
  size: {
    type: Number,
    default: 0
  },
  compressed: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Indexes
analyticsCacheSchema.index({ queryHash: 1, period: 1 });
analyticsCacheSchema.index({ createdAt: 1 });
analyticsCacheSchema.index({ hits: -1 });

const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);

export default AnalyticsCache;