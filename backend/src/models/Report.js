import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const chartConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LINE', 'BAR', 'PIE', 'DOUGHNUT', 'AREA', 'SCATTER', 'BUBBLE', 'RADAR', 'HEATMAP', 'TABLE'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  metrics: [String],
  dimensions: [String],
  options: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const scheduleSchema = new mongoose.Schema({
  frequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'HOURLY', 'CUSTOM'],
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  },
  dayOfMonth: Number,
  hour: Number,
  minute: Number,
  timezone: {
    type: String,
    default: 'UTC'
  },
  nextRun: Date,
  lastRun: Date
});

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  query: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  charts: [chartConfigSchema],
  schedule: scheduleSchema,
  format: {
    type: String,
    enum: ['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML'],
    default: 'PDF'
  },
  recipients: [String],
  deliveryMethod: {
    type: String,
    enum: ['EMAIL', 'WEBHOOK', 'SLACK', 'TEAMS', 'API', 'DASHBOARD'],
    default: 'EMAIL'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'FAILED', 'COMPLETED'],
    default: 'ACTIVE'
  },
  error: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  accessControl: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['VIEW', 'EDIT', 'ADMIN']
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  lastRun: Date,
  nextRun: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ organization: 1, status: 1 });
reportSchema.index({ 'schedule.nextRun': 1 });
reportSchema.index({ isPublic: 1, createdAt: -1 });
reportSchema.index({ tags: 1, createdAt: -1 });

reportSchema.plugin(aggregatePaginate);

const Report = mongoose.model('Report', reportSchema);

export default Report;