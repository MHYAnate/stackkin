import mongoose from 'mongoose';

const billingAddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String
}, { _id: false });

const billingSettingsSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    enum: ['CARD', 'BANK_TRANSFER', 'WALLET']
  },
  billingAddress: billingAddressSchema,
  taxId: String,
  invoiceFrequency: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'MANUAL']
  },
  autoRecharge: {
    type: Boolean,
    default: false
  },
  rechargeThreshold: {
    type: Number,
    default: 10000 // 100 NGN in kobo
  }
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  campaignNotifications: {
    type: Boolean,
    default: true
  },
  budgetNotifications: {
    type: Boolean,
    default: true
  },
  performanceNotifications: {
    type: Boolean,
    default: true
  },
  billingNotifications: {
    type: Boolean,
    default: true
  },
  emailFrequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'REAL_TIME', 'NONE'],
    default: 'WEEKLY'
  }
}, { _id: false });

const advertiserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: String,
  companyLogo: String,
  website: String,
  contactEmail: String,
  contactPhone: String,
  
  // Stats (cached for performance)
  totalCampaigns: {
    type: Number,
    default: 0
  },
  activeCampaigns: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageRoas: {
    type: Number,
    default: 0
  },
  
  // Settings
  billingSettings: billingSettingsSchema,
  notificationSettings: notificationSettingsSchema,
  
  // Verification
  verified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING'
  },
  verificationReason: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // Financial
  walletBalance: {
    type: Number,
    default: 0 // in kobo
  },
  creditLimit: {
    type: Number,
    default: 1000000 // 10,000 NGN in kobo
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
  }
});

advertiserSchema.index({ userId: 1 });
advertiserSchema.index({ verified: 1 });
advertiserSchema.index({ companyName: 1 });
advertiserSchema.index({ verificationStatus: 1 });

advertiserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Advertiser', advertiserSchema);