import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const retentionPointSchema = new mongoose.Schema({
  period: {
    type: Number,
    required: true
  },
  retained: {
    type: Number,
    required: true
  },
  retentionRate: {
    type: Number,
    required: true
  },
  active: Number,
  activityRate: Number,
  revenue: Number,
  conversions: Number,
  engagement: Number
});

const cohortSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  period: {
    type: String,
    enum: ['DAY_1', 'DAY_7', 'DAY_30', 'DAY_90', 'DAY_180'],
    required: true
  },
  metric: {
    type: String,
    enum: ['RETENTION_RATE', 'ACTIVITY_RATE', 'REVENUE', 'ENGAGEMENT', 'CONVERSION'],
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  retention: [retentionPointSchema],
  averageRetention: Number,
  peakRetention: Number,
  churnRate: Number,
  lifetimeValue: Number,
  paybackPeriod: Number,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  segment: String,
  filters: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed
  }],
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
cohortSchema.index({ organization: 1, startDate: -1 });
cohortSchema.index({ metric: 1, period: 1 });
cohortSchema.index({ calculatedAt: -1 });

cohortSchema.plugin(aggregatePaginate);

const Cohort = mongoose.model('Cohort', cohortSchema);

export default Cohort;