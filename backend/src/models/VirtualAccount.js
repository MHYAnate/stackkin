import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const virtualAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true
  },
  accountName: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  bankCode: {
    type: String,
    required: true
  },
  zainboxCode: {
    type: String,
    required: true
  },
  txnRef: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  amountInKobo: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'mismatch', 'expired', 'failed'],
    default: 'pending'
  },
  depositedAmount: {
    type: Number,
    default: 0
  },
  senderName: {
    type: String
  },
  senderAccountNumber: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 1800
  },
  email: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDynamic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

virtualAccountSchema.index({ userId: 1, status: 1 });
virtualAccountSchema.index({ txnRef: 1 });
virtualAccountSchema.index({ expiresAt: 1 });
virtualAccountSchema.index({ createdAt: -1 });

virtualAccountSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

virtualAccountSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const expires = new Date(this.expiresAt);
  return Math.max(0, Math.floor((expires - now) / 1000));
});

virtualAccountSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

const VirtualAccount = mongoose.model('VirtualAccount', virtualAccountSchema);
export default VirtualAccount;