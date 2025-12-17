// apps/backend/src/models/ABTest.js
import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  weight: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
  },
  participants: {
    type: Number,
    default: 0,
  },
  conversions: {
    type: Number,
    default: 0,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  metrics: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

variationSchema.virtual('conversionRate').get(function() {
  if (this.participants === 0) return 0;
  return (this.conversions / this.participants) * 100;
});

const abTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  hypothesis: {
    type: String,
    required: true,
  },
  metrics: [{
    type: String,
    required: true,
  }],
  primaryMetric: String,
  significanceLevel: {
    type: Number,
    default: 0.95,
    min: 0.8,
    max: 0.99,
  },
  minimumDetectableEffect: {
    type: Number,
    default: 0.05,
  },
  minimumSampleSize: Number,
  variations: [variationSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED'],
    default: 'DRAFT',
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
  },
  results: {
    winner: mongoose.Schema.Types.ObjectId,
    confidence: Number,
    significance: Boolean,
    metrics: [{
      name: String,
      controlValue: Number,
      variationValue: Number,
      improvement: Number,
      confidence: Number,
      significance: Boolean,
    }],
    recommendations: [String],
    insights: [String],
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  targetAudience: {
    filters: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed,
    }],
    percentage: {
      type: Number,
      default: 100,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

abTestSchema.index({ status: 1, startDate: 1 });
abTestSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model('ABTest', abTestSchema);