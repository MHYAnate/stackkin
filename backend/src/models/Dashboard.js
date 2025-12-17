import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

const dashboardLayoutSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['GRID', 'FLEX', 'CUSTOM'],
    default: 'GRID'
  },
  columns: {
    type: Number,
    default: 12
  },
  rows: Number,
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const dashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  layout: dashboardLayoutSchema,
  widgets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Widget'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['VIEW', 'EDIT', 'ADMIN']
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  refreshInterval: {
    type: Number,
    default: 300000 // 5 minutes
  },
  autoRefresh: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    enum: ['LIGHT', 'DARK', 'SYSTEM'],
    default: 'LIGHT'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  tags: [String],
  version: {
    type: Number,
    default: 1
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
dashboardSchema.index({ owner: 1, createdAt: -1 });
dashboardSchema.index({ 'sharedWith.userId': 1 });
dashboardSchema.index({ isPublic: 1, updatedAt: -1 });
dashboardSchema.index({ organization: 1, isPublic: 1 });
dashboardSchema.index({ tags: 1 });

dashboardSchema.plugin(aggregatePaginate);

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;