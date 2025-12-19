import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  nationality: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  
  // Professional Information
  techStack: [{
    type: String,
    trim: true
  }],
  employmentStatus: {
    type: String,
    enum: ['AVAILABLE', 'EMPLOYED', 'FREELANCING', 'NOT_LOOKING', 'OPEN_TO_OPPORTUNITIES'],
    default: 'AVAILABLE'
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  availableForHire: {
    type: Boolean,
    default: true
  },
  
  // Social Links
  github: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  portfolio: {
    type: String,
    default: ''
  },
  
  // Preferences
  preferredLanguages: [{
    type: String,
    default: []
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  showEmail: {
    type: Boolean,
    default: false
  },
  showPhone: {
    type: Boolean,
    default: false
  },
  
  // Role & Subscription
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'USER_MANAGEMENT_ADMIN', 'SOLUTIONS_MANAGEMENT_ADMIN', 
           'JOB_BOARD_ADMIN', 'MARKETPLACE_ADMIN', 'CHAT_ADMIN', 'VERIFICATION_ADMIN', 
           'SUBSCRIPTION_ADMIN', 'EMAIL_ADMIN', 'ADVERTISING_ADMIN', 'ANALYTICS_ADMIN', 'SECURITY_ADMIN'],
    default: 'USER'
  },
  subscriptionTier: {
    type: String,
    enum: ['FREE', 'BASE', 'MID', 'TOP'],
    default: 'FREE'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_SUBMITTED'
  },
  verificationDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification'
  }],
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'],
    default: 'ACTIVE'
  },
  deactivatedAt: Date,
  suspensionReason: String,
  suspensionEndsAt: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['APP', 'SMS', 'EMAIL'],
    default: null
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: [{
    type: String,
    select: false
  }],
  twoFactorVerifiedAt: Date,
  
  // Security
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  
  // Stats & Metrics
  profileViews: {
    type: Number,
    default: 0
  },
  lastLoginAt: Date,
  lastActiveAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Streak Information
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: Date,
  streakProtectionUsed: {
    type: Boolean,
    default: false
  },
  streakProtectionAvailableDate: Date,
  
  // Timestamps
  emailVerifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('stats').get(function() {
  return {
    totalSolutions: 0, // Will be populated by middleware
    totalJobs: 0,
    totalListings: 0,
    totalRatings: 0,
    averageRating: 0,
    totalViews: this.profileViews,
    totalClicks: 0,
    profileCompleteness: this.calculateProfileCompleteness(),
    reputationScore: 0,
    leaderboardRank: null
  };
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'techStack': 1 });
userSchema.index({ 'employmentStatus': 1 });

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('lastName') || this.isModified('firstName')) {
    this.updatedAt = Date.now();
  }
  next();
});

// Methods
userSchema.methods.calculateProfileCompleteness = function() {
  let score = 0;
  const fields = [
    { field: 'avatar', weight: 10 },
    { field: 'bio', weight: 10 },
    { field: 'nationality', weight: 5 },
    { field: 'location', weight: 5 },
    { field: 'techStack', weight: 15 },
    { field: 'employmentStatus', weight: 5 },
    { field: 'yearsOfExperience', weight: 10 },
    { field: 'github', weight: 5 },
    { field: 'linkedin', weight: 5 },
    { field: 'portfolio', weight: 10 },
    { field: 'isVerified', weight: 20 }
  ];

  fields.forEach(({ field, weight }) => {
    if (field === 'isVerified') {
      if (this[field]) score += weight;
    } else if (this[field]) {
      if (Array.isArray(this[field])) {
        if (this[field].length > 0) score += weight;
      } else if (typeof this[field] === 'string') {
        if (this[field].trim().length > 0) score += weight;
      } else if (typeof this[field] === 'number') {
        if (this[field] > 0) score += weight;
      }
    }
  });

  return Math.min(score, 100);
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

const User = mongoose.model('User', userSchema);

export default User;