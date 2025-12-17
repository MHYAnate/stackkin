import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const reportRunSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number,
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  error: String,
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generatedFile: String,
  fileUrl: String,
  fileSize: Number,
  sentTo: [String],
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  triggeredByType: {
    type: String,
    enum: ['USER', 'SCHEDULE', 'API', 'SYSTEM'],
    default: 'USER'
  },
  metrics: {
    totalRecords: Number,
    processingTime: Number,
    memoryUsage: Number,
    queryDuration: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
reportRunSchema.index({ report: 1, startedAt: -1 });
reportRunSchema.index({ status: 1, startedAt: -1 });
reportRunSchema.index({ triggeredBy: 1, startedAt: -1 });
reportRunSchema.index({ 'result.generatedAt': -1 });

reportRunSchema.plugin(aggregatePaginate);

const ReportRun = mongoose.model('ReportRun', reportRunSchema);

export default ReportRun;