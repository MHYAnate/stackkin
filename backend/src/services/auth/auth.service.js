import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../../models/User.js';
import Session from '../../models/UserSession.js';
import Verification from '../../models/Verification.js';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../notification/email.service.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiry = process.env.JWT_EXPIRY || '7d';
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '30d';
  }

  // Register new user
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { username: userData.username.toLowerCase() }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email.toLowerCase()) {
          throw new AppError('Email already registered', 400);
        }
        if (existingUser.username === userData.username.toLowerCase()) {
          throw new AppError('Username already taken', 400);
        }
      }

      // Create new user
      const user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.toLowerCase(),
        username: userData.username.toLowerCase(),
        password: userData.password,
        acceptedTerms: userData.acceptedTerms
      });

      await user.save();

      // Generate email verification token
      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      // Send verification email
      await sendVerificationEmail(user.email, user.firstName, verificationToken);

      // Generate tokens
      const tokens = await this.generateTokens(user._id);

      // Create session
      await this.createSession(user._id, tokens.refreshToken, userData.deviceInfo);

      logger.info(`User registered: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password, deviceInfo = {}) {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password +loginAttempts +lockUntil');

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AppError('Account is temporarily locked. Try again later.', 423);
      }

      // Check if account is active
      if (user.accountStatus !== 'ACTIVE') {
        throw new AppError('Account is not active', 403);
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        throw new AppError('Invalid email or password', 401);
      }

      // Reset login attempts on successful login
      await User.findByIdAndUpdate(user._id, {
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
      });

      // Update last login
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      user.loginCount += 1;
      await user.save({ validateBeforeSave: false });

      // Generate tokens
      const tokens = await this.generateTokens(user._id);

      // Create session
      await this.createSession(user._id, tokens.refreshToken, deviceInfo);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
        requiresTwoFactor: user.twoFactorEnabled
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Two-factor authentication
  async verifyTwoFactor(userId, code, method = 'APP') {
    try {
      const user = await User.findById(userId).select('+twoFactorSecret');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('Two-factor authentication is not enabled', 400);
      }

      let verified = false;

      if (method === 'APP') {
        verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: code,
          window: 2
        });
      } else if (method === 'BACKUP') {
        // Check backup codes
        const index = user.twoFactorBackupCodes.indexOf(code);
        if (index > -1) {
          user.twoFactorBackupCodes.splice(index, 1);
          await user.save({ validateBeforeSave: false });
          verified = true;
        }
      }

      if (!verified) {
        throw new AppError('Invalid verification code', 401);
      }

      user.twoFactorVerifiedAt = new Date();
      await user.save({ validateBeforeSave: false });

      return {
        success: true,
        message: 'Two-factor authentication successful'
      };
    } catch (error) {
      logger.error('Two-factor verification error:', error);
      throw error;
    }
  }

  // Setup two-factor authentication
  async setupTwoFactor(userId, method = 'APP', phoneNumber = null) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.twoFactorEnabled) {
        throw new AppError('Two-factor authentication is already enabled', 400);
      }

      let secret;
      let qrCodeUrl;

      if (method === 'APP') {
        secret = speakeasy.generateSecret({
          name: `Stackkin:${user.email}`,
          length: 20
        });

        user.twoFactorSecret = secret.base32;
        qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      } else if (method === 'SMS' || method === 'EMAIL') {
        secret = crypto.randomBytes(20).toString('hex');
        user.twoFactorSecret = secret;
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      user.twoFactorMethod = method;
      user.twoFactorBackupCodes = backupCodes;

      if (method === 'SMS' && phoneNumber) {
        // Store phone number for SMS verification
        user.phoneNumber = phoneNumber;
      }

      await user.save({ validateBeforeSave: false });

      return {
        secret: method === 'APP' ? secret.base32 : null,
        qrCode: qrCodeUrl,
        backupCodes,
        method
      };
    } catch (error) {
      logger.error('Two-factor setup error:', error);
      throw error;
    }
  }

  // Enable two-factor authentication
  async enableTwoFactor(userId, code) {
    try {
      const user = await User.findById(userId).select('+twoFactorSecret');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.twoFactorEnabled) {
        throw new AppError('Two-factor authentication is already enabled', 400);
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        throw new AppError('Invalid verification code', 401);
      }

      user.twoFactorEnabled = true;
      user.twoFactorVerifiedAt = new Date();
      await user.save({ validateBeforeSave: false });

      return {
        success: true,
        message: 'Two-factor authentication enabled successfully'
      };
    } catch (error) {
      logger.error('Enable two-factor error:', error);
      throw error;
    }
  }

  // Disable two-factor authentication
  async disableTwoFactor(userId, code) {
    try {
      const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.twoFactorEnabled) {
        throw new AppError('Two-factor authentication is not enabled', 400);
      }

      // Verify code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        // Check backup codes
        const index = user.twoFactorBackupCodes.indexOf(code);
        if (index === -1) {
          throw new AppError('Invalid verification code', 401);
        }
        user.twoFactorBackupCodes.splice(index, 1);
      }

      // Disable two-factor
      user.twoFactorEnabled = false;
      user.twoFactorMethod = null;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      user.twoFactorVerifiedAt = null;

      await user.save({ validateBeforeSave: false });

      return {
        success: true,
        message: 'Two-factor authentication disabled successfully'
      };
    } catch (error) {
      logger.error('Disable two-factor error:', error);
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal that user doesn't exist
        return {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        };
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Send reset email
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);

      logger.info(`Password reset requested for: ${user.email}`);

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = Date.now();

      await user.save();

      // Invalidate all sessions
      await Session.deleteMany({ user: user._id });

      logger.info(`Password reset for: ${user.email}`);

      return {
        success: true,
        message: 'Password reset successful. Please login with your new password.'
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = Date.now();

      await user.save();

      // Invalidate all other sessions
      await Session.deleteMany({
        user: user._id,
        _id: { $ne: req.session._id } // Keep current session
      });

      logger.info(`Password changed for user: ${user.email}`);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      // Hash token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
      }

      // Update user
      user.isVerified = true;
      user.emailVerifiedAt = new Date();
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      // Generate new tokens
      const tokens = await this.generateTokens(user._id);

      logger.info(`Email verified for: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isVerified) {
        throw new AppError('Email is already verified', 400);
      }

      // Generate new token
      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      // Send verification email
      await sendVerificationEmail(user.email, user.firstName, verificationToken);

      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      logger.error('Resend verification error:', error);
      throw error;
    }
  }

  // Generate JWT tokens
  async generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );

    const refreshToken = jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
      
      // Check if session exists
      const session = await Session.findOne({
        user: decoded.userId,
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(decoded.userId);

      // Update session with new refresh token
      session.refreshToken = tokens.refreshToken;
      session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await session.save();

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Create session
  async createSession(userId, refreshToken, deviceInfo = {}) {
    try {
      const session = new Session({
        user: userId,
        sessionId: crypto.randomBytes(32).toString('hex'),
        refreshToken,
        deviceInfo,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await session.save();
      return session;
    } catch (error) {
      logger.error('Create session error:', error);
      throw error;
    }
  }

  // Get user sessions
  async getUserSessions(userId) {
    try {
      const sessions = await Session.find({
        user: userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).sort({ lastAccessedAt: -1 });

      return sessions;
    } catch (error) {
      logger.error('Get user sessions error:', error);
      throw error;
    }
  }

  // Terminate session
  async terminateSession(userId, sessionId) {
    try {
      const session = await Session.findOneAndUpdate(
        {
          _id: sessionId,
          user: userId,
          isActive: true
        },
        {
          isActive: false
        },
        { new: true }
      );

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      return {
        success: true,
        message: 'Session terminated successfully'
      };
    } catch (error) {
      logger.error('Terminate session error:', error);
      throw error;
    }
  }

  // Terminate all other sessions
  async terminateAllOtherSessions(userId, currentSessionId) {
    try {
      await Session.updateMany(
        {
          user: userId,
          _id: { $ne: currentSessionId },
          isActive: true
        },
        {
          isActive: false
        }
      );

      return {
        success: true,
        message: 'All other sessions terminated successfully'
      };
    } catch (error) {
      logger.error('Terminate all sessions error:', error);
      throw error;
    }
  }

  // Logout
  async logout(sessionId) {
    try {
      await Session.findByIdAndUpdate(sessionId, {
        isActive: false
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // Sanitize user object (remove sensitive data)
  sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    
    delete userObj.password;
    delete userObj.passwordChangedAt;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    delete userObj.emailVerificationToken;
    delete userObj.emailVerificationExpires;
    delete userObj.loginAttempts;
    delete userObj.lockUntil;
    delete userObj.twoFactorSecret;
    delete userObj.twoFactorBackupCodes;

    return userObj;
  }
}

export default new AuthService();