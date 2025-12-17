import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  event: {
    type: String,
    enum: [
      'PAGE_VIEW', 'BUTTON_CLICK', 'FORM_SUBMIT', 'SEARCH', 'FILTER', 'SORT',
      'DOWNLOAD', 'SHARE', 'LIKE', 'COMMENT', 'RATING', 'PURCHASE',
      'SUBSCRIPTION', 'REGISTRATION', 'LOGIN', 'LOGOUT', 'ERROR', 'CUSTOM'
    ],
    required: true
  },
  filters: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed
  }],
  timeLimit: Number,
  entered: {
    type: Number,
    default: 0
  },
  converted: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  dropOffRate: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number,
    default: 0
  }
});

const patternSchema = new mongoose.Schema({
  sequence: [String],
  count: {
    type: Number,
    required: true
  },
  conversionRate: Number,
  averageTime: Number,
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const dropOffSchema = new mongoose.Schema({
  fromStage: {
    type: String,
    required: true
  },
  toStage: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  reasons: [{
    reason: String,
    count: Number,
    percentage: Number,
    examples: [String]
  }]
});

const optimizationOpportunitySchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true
  },
  metric: {
    type: String,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  improvementPotential: {
    type: Number,
    required: true
  },
  actions: [String],
  estimatedImpact: Number
});

const funnelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  stages: [stageSchema],
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalEntered: {
    type: Number,
    default: 0
  },
  totalConverted: {
    type: Number,
    default: 0
  },
  overallConversionRate: {
    type: Number,
    default: 0
  },
  averageTimeToConvert: {
    type: Number,
    default: 0
  },
  dropOffs: [dropOffSchema],
  patterns: [patternSchema],
  opportunities: [optimizationOpportunitySchema],
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
funnelSchema.index({ organization: 1, startDate: -1 });
funnelSchema.index({ name: 1, calculatedAt: -1 });
funnelSchema.index({ 'stages.event': 1 });

funnelSchema.plugin(aggregatePaginate);

const Funnel = mongoose.model('Funnel', funnelSchema);

export default Funnel;