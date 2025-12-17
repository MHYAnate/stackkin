import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'THRESHOLD_EXCEEDED', 'THRESHOLD_BREACHED', 'ANOMALY_DETECTED',
      'ERROR_RATE_HIGH', 'PERFORMANCE_DEGRADATION', 'AVAILABILITY_ISSUE',
      'SECURITY_ISSUE', 'CUSTOM'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  metric: {
    type: String,
    required: true,
    index: true
  },
  threshold: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    enum: [
      'GREATER_THAN', 'LESS_THAN', 'EQUALS', 'NOT_EQUALS',
      'GREATER_THAN_EQUALS', 'LESS_THAN_EQUALS', 'CHANGED_BY', 'OUTSIDE_RANGE'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  acknowledged: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notificationChannels: [{
    type: String,
    enum: ['EMAIL', 'SMS', 'SLACK', 'TEAMS', 'WEBHOOK', 'IN_APP']
  }],
  cooldown: {
    type: Number,
    default: 300000 // 5 minutes
  },
  lastTriggered: Date,
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  relatedEntities: [{
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId
  }],
  resolution: {
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionNotes: String
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ severity: 1, timestamp: -1 });
alertSchema.index({ acknowledged: 1, timestamp: -1 });
alertSchema.index({ enabled: 1, type: 1 });
alertSchema.index({ 'resolution.resolved': 1, timestamp: -1 });
alertSchema.index({ organization: 1, timestamp: -1 });

alertSchema.plugin(aggregatePaginate);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;