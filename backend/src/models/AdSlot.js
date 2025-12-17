import mongoose from 'mongoose';

const restrictionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['CATEGORY', 'CONTENT', 'ADVERTISER', 'BUDGET', 'SCHEDULE', 'GEOGRAPHY', 'DEVICE', 'CUSTOM']
  },
  value: String,
  message: String
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  totalImpressions: Number,
  availableImpressions: Number,
  bookedImpressions: Number,
  startDate: Date,
  endDate: Date
}, { _id: false });

const adSlotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['BANNER', 'INTERSTITIAL', 'NATIVE', 'VIDEO', 'CAROUSEL', 'POPUP', 'SIDEBAR', 'IN_FEED'],
    required: true
  },
  format: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'HTML', 'TEXT', 'RICH_MEDIA'],
    required: true
  },
  position: {
    type: String,
    enum: ['TOP', 'MIDDLE', 'BOTTOM', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'IN_CONTENT', 'POPUP', 'NOTIFICATION'],
    required: true
  },
  
  // Dimensions
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: true,
    min: 1
  },
  pricingModel: {
    type: String,
    enum: ['FIXED', 'AUCTION', 'HYBRID'],
    default: 'AUCTION'
  },
  availability: availabilitySchema,
  
  // Targeting
  allowedTargeting: [{
    type: String,
    enum: ['DEMOGRAPHIC', 'GEOGRAPHIC', 'BEHAVIORAL', 'CONTEXTUAL', 'RETARGETING', 'LOOKALIKE']
  }],
  restrictions: [restrictionSchema],
  
  // Performance
  fillRate: {
    type: Number,
    default: 0
  },
  ctrBenchmark: {
    type: Number,
    default: 0.5 // 0.5% CTR benchmark
  },
  
  // Status
  active: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

adSlotSchema.index({ position: 1, type: 1 });
adSlotSchema.index({ active: 1 });
adSlotSchema.index({ pricingModel: 1 });
adSlotSchema.index({ basePrice: 1 });

adSlotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

adSlotSchema.virtual('aspectRatio').get(function() {
  if (!this.width || !this.height) return '1:1';
  
  const gcd = (a, b) => {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };
  
  const divisor = gcd(this.width, this.height);
  return `${this.width / divisor}:${this.height / divisor}`;
});

adSlotSchema.set('toJSON', { virtuals: true });
adSlotSchema.set('toObject', { virtuals: true });

export default mongoose.model('AdSlot', adSlotSchema);