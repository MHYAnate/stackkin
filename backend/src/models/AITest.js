import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const variationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  participants: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  confidence: Number,
  pValue: Number,
  improvement: Number,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const metricResultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  controlValue: {
    type: Number,
    default: 0
  },
  variationValue: {
    type: Number,
    default: 0
  },
  improvement: {
    type: Number,
    default: 0
  },
  confidence: Number,
  significance: {
    type: Boolean,
    default: false
  }
});

const testResultsSchema = new mongoose.Schema({
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation'
  },
  confidence: Number,
  significance: {
    type: Boolean,
    default: false
  },
  metrics: [metricResultSchema],
  recommendations: [String],
  insights: [String],
  calculatedAt: Date
});

const aiTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  hypothesis: {
    type: String,
    required: true
  },
  metrics: [{
    type: String,
    required: true
  }],
  significanceLevel: {
    type: Number,
    default: 0.05,
    min: 0.01,
    max: 0.1
  },
  variations: [variationSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'STOPPED'],
    default: 'DRAFT'
  },
  results: testResultsSchema,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  targetAudience: {
    segments: [String],
    filters: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  sampleSize: Number,
  confidenceThreshold: {
    type: Number,
    default: 0.95
  },
  minSampleSize: {
    type: Number,
    default: 100
  },
  autoStop: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
aiTestSchema.index({ createdBy: 1, status: 1 });
aiTestSchema.index({ organization: 1, startDate: -1 });
aiTestSchema.index({ status: 1, endDate: 1 });
aiTestSchema.index({ 'variations.participants': -1 });

aiTestSchema.plugin(aggregatePaginate);

const AITest = mongoose.model('AITest', aiTestSchema);

export default AITest;