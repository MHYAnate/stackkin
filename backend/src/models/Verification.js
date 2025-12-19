import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'VOTERS_CARD'],
    required: true
  },
  documentNumber: {
    type: String,
    required: true,
    trim: true
  },
  documentImage: {
    type: String,
    required: true
  },
  additionalImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  expiryDate: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

verificationSchema.index({ user: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ documentType: 1 });
verificationSchema.index({ submittedAt: -1 });

const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;