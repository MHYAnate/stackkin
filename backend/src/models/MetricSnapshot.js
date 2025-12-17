import mongoose from 'mongoose';

const metricSnapshotSchema = new mongoose.Schema({
  metric: {
    type: String,
    required: true,
    index: true
  },
  period: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  previousValue: Number,
  change: Number,
  changePercentage: Number,
  breakdown: [{
    dimension: String,
    value: String,
    count: Number,
    percentage: Number
  }],
  trend: {
    type: String,
    enum: ['UP', 'DOWN', 'FLAT', 'VOLATILE']
  },
  confidence: Number,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  segment: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
metricSnapshotSchema.index({ metric: 1, period: 1, date: 1 });
metricSnapshotSchema.index({ organization: 1, metric: 1, date: -1 });
metricSnapshotSchema.index({ date: 1, period: 1 });

const MetricSnapshot = mongoose.model('MetricSnapshot', metricSnapshotSchema);

export default MetricSnapshot;