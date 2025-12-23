import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  txnRef: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'transfer', 'card_payment', 'recurring', 'refund', 'settlement'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled', 'processing'],
    default: 'pending'
  },
  gateway: {
    type: String,
    enum: ['zainpay', 'paystack', 'flutterwave', 'stripe'],
    default: 'zainpay'
  },
  gatewayRef: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'wallet', 'virtual_account', 'recurring'],
    default: 'virtual_account'
  },
  description: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  // Webhook data
  webhookData: {
    type: mongoose.Schema.Types.Mixed
  },
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

transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ txnRef: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'metadata.orderId': 1 });

transactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'success';
});

transactionSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

transactionSchema.virtual('formattedAmount').get(function() {
  return `₦${this.amount.toLocaleString('en-NG')}`;
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;