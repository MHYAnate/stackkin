import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  virtualAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualAccount'
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
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  gateway: {
    type: String,
    enum: ['zainpay', 'paystack', 'flutterwave'],
    default: 'zainpay'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'card', 'wallet'],
    default: 'bank_transfer'
  },
  gatewayRef: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);