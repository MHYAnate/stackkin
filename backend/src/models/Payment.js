import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHOD, CURRENCY, PAYMENT_TYPE } from '../constants/paymentConstants.js';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Core Payment Fields
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.NGN
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    default: PAYMENT_METHOD.VIRTUAL_ACCOUNT
  },
  paymentType: {
    type: String,
    enum: Object.values(PAYMENT_TYPE),
    required: true,
    index: true
  },
  
  // References
  gateway: {
    type: String,
    enum: ['zainpay', 'paystack', 'flutterwave', 'stripe', 'paypal', 'custom'],
    default: 'zainpay'
  },
  gatewayRef: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  externalReference: {
    type: String,
    sparse: true
  },
  
  // Related Entities - Keeping only relevant references from your new model
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    index: true
  },
  virtualAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualAccount',
    index: true
  },
  
  // New references from comprehensive model (optional, based on your needs)
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    index: true
  },
  
  // Fee Structure (optional but recommended)
  gatewayFee: {
    type: Number,
    default: 0,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Payment Details
  cardLastFour: {
    type: String,
    match: [/^\d{4}$/, 'Card last four must be exactly 4 digits']
  },
  cardBrand: {
    type: String
  },
  cardCountry: {
    type: String
  },
  
  // Timing
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: true
  },
  
  // URLs for callbacks
  redirectUrl: {
    type: String
  },
  callbackUrl: {
    type: String
  },
  
  // Response Data
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Idempotency
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Payment Description (optional but useful)
  description: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
paymentSchema.virtual('totalFee').get(function() {
  return this.gatewayFee + this.platformFee;
});

paymentSchema.virtual('netAmount').get(function() {
  return this.amount - (this.gatewayFee + this.platformFee);
});

paymentSchema.virtual('reference').get(function() {
  return this.gatewayRef || this.externalReference || this._id.toString();
});

// Payment status virtuals for easy querying
paymentSchema.virtual('isPending').get(function() {
  return this.status === PAYMENT_STATUS.PENDING;
});

paymentSchema.virtual('isCompleted').get(function() {
  return this.status === PAYMENT_STATUS.COMPLETED;
});

paymentSchema.virtual('isFailed').get(function() {
  return this.status === PAYMENT_STATUS.FAILED;
});

paymentSchema.virtual('isRefunded').get(function() {
  return this.status === PAYMENT_STATUS.REFUNDED;
});

// Pre-save middleware to update timestamps based on status changes
paymentSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case PAYMENT_STATUS.PROCESSING:
        this.processedAt = now;
        break;
      case PAYMENT_STATUS.COMPLETED:
        this.completedAt = now;
        break;
      case PAYMENT_STATUS.REFUNDED:
        this.refundedAt = now;
        break;
    }
  }
  
  // Set expiresAt if not set and payment is pending
  if (!this.expiresAt && this.status === PAYMENT_STATUS.PENDING) {
    const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
    this.expiresAt = new Date(this.initiatedAt.getTime() + expiresIn);
  }
  
  next();
});

// Indexes for optimized queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, expiresAt: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ gateway: 1, gatewayRef: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ 'metadata.orderNumber': 1 }); // If you store order numbers in metadata

// Method to check if payment is expired
paymentSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to update status safely
paymentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  if (additionalData.gatewayResponse) {
    this.gatewayResponse = {
      ...this.gatewayResponse,
      ...additionalData.gatewayResponse
    };
  }
  
  if (additionalData.metadata) {
    this.metadata = {
      ...this.metadata,
      ...additionalData.metadata
    };
  }
  
  return this.save();
};

// Static method to find payment by reference
paymentSchema.statics.findByReference = function(reference) {
  return this.findOne({
    $or: [
      { gatewayRef: reference },
      { externalReference: reference },
      { _id: mongoose.Types.ObjectId.isValid(reference) ? reference : null }
    ]
  });
};

// Static method to get user's payment summary
paymentSchema.statics.getUserSummary = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  return result.reduce((acc, curr) => {
    acc[curr._id] = {
      count: curr.count,
      totalAmount: curr.totalAmount
    };
    return acc;
  }, {});
};

export default mongoose.model('Payment', paymentSchema);