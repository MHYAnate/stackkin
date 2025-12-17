import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const chartConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LINE', 'BAR', 'PIE', 'DOUGHNUT', 'AREA', 'SCATTER', 'BUBBLE', 'RADAR', 'HEATMAP', 'TABLE'],
    required: true
  },
  title: String,
  description: String,
  metrics: [String],
  dimensions: [String],
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const widgetPositionSchema = new mongoose.Schema({
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  }
});

const widgetSizeSchema = new mongoose.Schema({
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  minWidth: {
    type: Number,
    default: 1
  },
  minHeight: {
    type: Number,
    default: 1
  },
  maxWidth: Number,
  maxHeight: Number
});

const widgetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['METRIC', 'CHART', 'TABLE', 'HEATMAP', 'FUNNEL', 'COHORT', 'GEO', 'TIMELINE', 'CUSTOM'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  query: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  chartConfig: chartConfigSchema,
  position: widgetPositionSchema,
  size: widgetSizeSchema,
  refreshable: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: true
  },
  removable: {
    type: Boolean,
    default: true
  },
  dashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dashboard',
    required: true,
    index: true
  },
  dataSource: {
    type: String,
    enum: ['ANALYTICS', 'EXTERNAL', 'CUSTOM'],
    default: 'ANALYTICS'
  },
  dataConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  refreshInterval: Number,
  lastRefreshed: Date,
  cacheKey: String,
  cacheTTL: {
    type: Number,
    default: 300 // 5 minutes
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
widgetSchema.index({ dashboardId: 1, createdAt: -1 });
widgetSchema.index({ type: 1, createdAt: -1 });
widgetSchema.index({ 'query.period': 1 });

widgetSchema.plugin(aggregatePaginate);

const Widget = mongoose.model('Widget', widgetSchema);

export default Widget;