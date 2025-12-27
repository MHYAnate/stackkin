import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { 
  PAYMENT_STATUS, 
  TRANSACTION_TYPE, 
  PAYMENT_METHOD,
  CURRENCY 
} from '../constants/paymentConstants.js';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Core Transaction Fields
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.NGN
  },
  type: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true
  },
  
  // References
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  escrowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escrow'
  },
  withdrawalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal'
  },
  
  // Transaction Identifiers
  reference: {
    type: String,
    required: true,
    unique: true,
    alias: 'txnRef' // Support both names
  },
  narration: {
    type: String,
    required: true,
    alias: 'description' // Support both names
  },
  
  // Balance Tracking
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  
  // Payment Gateway Details
  gateway: {
    type: String,
    enum: ['zainpay', 'paystack', 'flutterwave', 'stripe', 'manual'],
    default: 'zainpay'
  },
  gatewayRef: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    default: PAYMENT_METHOD.VIRTUAL_ACCOUNT
  },
  
  // For bank transfers
  beneficiaryAccountNumber: {
    type: String
  },
  beneficiaryAccountName: {
    type: String
  },
  beneficiaryBankCode: {
    type: String
  },
  beneficiaryBankName: {
    type: String
  },
  
  // For card payments
  cardToken: {
    type: String
  },
  cardLast4: {
    type: String
  },
  cardBrand: {
    type: String
  },
  
  // Metadata & Audit Info
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Timestamps
  settledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
transactionSchema.virtual('direction').get(function() {
  const incomingTypes = [
    TRANSACTION_TYPE.DEPOSIT,
    TRANSACTION_TYPE.REFUND,
    TRANSACTION_TYPE.ESCROW_RELEASE,
    TRANSACTION_TYPE.COMMISSION,
    TRANSACTION_TYPE.BONUS
  ];
  return incomingTypes.includes(this.type) ? 'INCOMING' : 'OUTGOING';
});

transactionSchema.virtual('isSuccessful').get(function() {
  return this.status === PAYMENT_STATUS.SUCCESS;
});

transactionSchema.virtual('isFailed').get(function() {
  return this.status === PAYMENT_STATUS.FAILED;
});

transactionSchema.virtual('formattedAmount').get(function() {
  const currencySymbols = {
    [CURRENCY.NGN]: '₦',
    [CURRENCY.USD]: '$',
    [CURRENCY.GBP]: '£',
    [CURRENCY.EUR]: '€'
  };
  
  const symbol = currencySymbols[this.currency] || '₦';
  return `${symbol}${this.amount.toLocaleString('en-NG')}`;
});

// Helper method to check if transaction is complete
transactionSchema.methods.isComplete = function() {
  return this.status === PAYMENT_STATUS.SUCCESS && this.completedAt !== null;
};

// Helper method to mark as completed
transactionSchema.methods.markAsCompleted = function(timestamp = new Date()) {
  this.status = PAYMENT_STATUS.SUCCESS;
  this.completedAt = timestamp;
  return this.save();
};

// Helper method to mark as failed
transactionSchema.methods.markAsFailed = function(reason) {
  this.status = PAYMENT_STATUS.FAILED;
  this.failureReason = reason;
  return this.save();
};

// Pre-save middleware to ensure required fields based on transaction type
transactionSchema.pre('save', function(next) {
  if (this.type === TRANSACTION_TYPE.WITHDRAWAL && !this.beneficiaryAccountNumber) {
    next(new Error('Beneficiary account details are required for withdrawals'));
    return;
  }
  
  // Auto-generate reference if not provided (using the old txnRef if exists)
  if (!this.reference) {
    if (this.txnRef) {
      this.reference = this.txnRef;
    } else {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      this.reference = `TXN-${timestamp}-${random}`;
    }
  }
  
  // Ensure narration/description
  if (!this.narration) {
    if (this.description) {
      this.narration = this.description;
    } else {
      this.narration = `${this.type} - ${this.status}`;
    }
  }
  
  next();
});

// Indexes
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'metadata.orderId': 1 });
transactionSchema.index({ paymentId: 1 });
transactionSchema.index({ escrowId: 1 });
transactionSchema.index({ withdrawalId: 1 });
transactionSchema.index({ gatewayRef: 1 });
transactionSchema.index({ completedAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// Add pagination plugin
transactionSchema.plugin(mongoosePaginate);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;