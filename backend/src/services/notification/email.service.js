import { Resend } from 'resend';
import logger from '../../config/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  // Send verification email
  async sendVerificationEmail(to, name, token) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
      
      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Verify Your Email - Stackkin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Stackkin! 🚀</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Thank you for joining Stackkin! We're excited to have you on board.</p>
                <p>To complete your registration and start exploring amazing solutions, jobs, and opportunities, please verify your email address by clicking the button below:</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </p>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
                
                <p>This verification link will expire in 24 hours.</p>
                
                <p>If you didn't create an account with Stackkin, you can safely ignore this email.</p>
                
                <div class="footer">
                  <p>Best regards,<br>The Stackkin Team</p>
                  <p>Need help? Contact our support team at <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                  <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error('Send verification email error:', error);
        throw new Error('Failed to send verification email');
      }

      logger.info(`Verification email sent to: ${to}`);
      return data;
    } catch (error) {
      logger.error('Send verification email error:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(to, name, token) {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      
      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Reset Your Password - Stackkin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset 🔐</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>We received a request to reset your password for your Stackkin account.</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                
                <div class="warning">
                  <p><strong>⚠️ Important:</strong> This link will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact our support team immediately.</p>
                </div>
                
                <p>For security reasons, we recommend:</p>
                <ul>
                  <li>Using a strong, unique password</li>
                  <li>Enabling two-factor authentication</li>
                  <li>Not sharing your password with anyone</li>
                </ul>
                
                <div class="footer">
                  <p>Best regards,<br>The Stackkin Team</p>
                  <p>Need help? Contact our support team at <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                  <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error('Send password reset email error:', error);
        throw new Error('Failed to send password reset email');
      }

      logger.info(`Password reset email sent to: ${to}`);
      return data;
    } catch (error) {
      logger.error('Send password reset email error:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(to, name) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Welcome to Stackkin!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
              .feature { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
              .feature-icon { font-size: 30px; margin-bottom: 10px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to the Stackkin Community! 🎉</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>Congratulations on joining Stackkin! We're thrilled to have you as part of our growing community of developers, creators, and innovators.</p>
                
                <h3>Here's what you can do on Stackkin:</h3>
                
                <div class="features">
                  <div class="feature">
                    <div class="feature-icon">💡</div>
                    <h4>Share Solutions</h4>
                    <p>Share your coding solutions and help others learn</p>
                  </div>
                  <div class="feature">
                    <div class="feature-icon">💼</div>
                    <h4>Find Jobs</h4>
                    <p>Discover amazing opportunities that match your skills</p>
                  </div>
                  <div class="feature">
                    <div class="feature-icon">🛒</div>
                    <h4>Marketplace</h4>
                    <p>Sell your digital products and services</p>
                  </div>
                  <div class="feature">
                    <div class="feature-icon">👥</div>
                    <h4>Join Squads</h4>
                    <p>Collaborate with other developers on projects</p>
                  </div>
                </div>
                
                <h3>Get Started:</h3>
                <ol>
                  <li>Complete your profile to increase visibility</li>
                  <li>Add your skills and experience</li>
                  <li>Explore solutions and jobs in your field</li>
                  <li>Connect with other developers</li>
                </ol>
                
                <p>Need help getting started? Check out our <a href="${process.env.CLIENT_URL}/help">Help Center</a> or join our <a href="https://community.stackkin.com">Community Forum</a>.</p>
                
                <div class="footer">
                  <p>Happy coding!<br>The Stackkin Team</p>
                  <p>Need help? Contact our support team at <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                  <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error('Send welcome email error:', error);
        throw new Error('Failed to send welcome email');
      }

      logger.info(`Welcome email sent to: ${to}`);
      return data;
    } catch (error) {
      logger.error('Send welcome email error:', error);
      throw error;
    }
  }

  // Send two-factor authentication email
  async sendTwoFactorEmail(to, name, code) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Your Two-Factor Authentication Code - Stackkin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { font-size: 32px; letter-spacing: 10px; text-align: center; margin: 30px 0; padding: 20px; background: white; border: 2px dashed #43e97b; border-radius: 10px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Two-Factor Authentication 🔒</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                <p>You're receiving this email because you requested two-factor authentication for your Stackkin account.</p>
                
                <div class="code">
                  ${code}
                </div>
                
                <div class="warning">
                  <p><strong>⚠️ Security Alert:</strong></p>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you didn't request this code, please secure your account immediately by changing your password and contacting our support team.</p>
                </div>
                
                <p>For your security, never share this code with anyone. Stackkin support will never ask for your verification code.</p>
                
                <div class="footer">
                  <p>Best regards,<br>The Stackkin Team</p>
                  <p>Need help? Contact our support team at <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                  <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error('Send two-factor email error:', error);
        throw new Error('Failed to send two-factor email');
      }

      logger.info(`Two-factor email sent to: ${to}`);
      return data;
    } catch (error) {
      logger.error('Send two-factor email error:', error);
      throw error;
    }
  }

  // Send account security alert
  async sendSecurityAlert(to, name, alertType, details) {
    try {
      let subject = '';
      let alertMessage = '';
      
      switch (alertType) {
        case 'password_changed':
          subject = 'Password Changed - Stackkin';
          alertMessage = 'Your password was recently changed.';
          break;
        case 'new_device':
          subject = 'New Device Login - Stackkin';
          alertMessage = 'Your account was accessed from a new device.';
          break;
        case 'suspicious_activity':
          subject = 'Suspicious Activity Detected - Stackkin';
          alertMessage = 'We detected suspicious activity on your account.';
          break;
        default:
          subject = 'Security Alert - Stackkin';
          alertMessage = 'There was activity on your account that requires your attention.';
      }
      
      const { data, error } = await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert { background: #ffebee; border: 1px solid #ffcdd2; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .actions { margin: 30px 0; }
              .button { display: inline-block; padding: 10px 20px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px; }
              .button-secondary { background: #757575; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Security Alert 🚨</h1>
              </div>
              <div class="content">
                <h2>Hi ${name},</h2>
                
                <div class="alert">
                  <h3>${alertMessage}</h3>
                </div>
                
                ${details ? `
                <div class="details">
                  <h4>Activity Details:</h4>
                  <pre>${JSON.stringify(details, null, 2)}</pre>
                </div>
                ` : ''}
                
                <div class="actions">
                  <p>If this was you, no action is needed.</p>
                  <p>If you don't recognize this activity:</p>
                  
                  <a href="${process.env.CLIENT_URL}/account/security" class="button">Review Account Security</a>
                  <a href="${process.env.CLIENT_URL}/account/password/change" class="button button-secondary">Change Password</a>
                </div>
                
                <p>For immediate assistance, contact our support team.</p>
                
                <div class="footer">
                  <p>Stay safe,<br>The Stackkin Security Team</p>
                  <p>Contact support: <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                  <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        logger.error('Send security alert error:', error);
        throw new Error('Failed to send security alert');
      }

      logger.info(`Security alert sent to: ${to} - Type: ${alertType}`);
      return data;
    } catch (error) {
      logger.error('Send security alert error:', error);
      throw error;
    }
  }

  // Add these methods to the existing EmailService class

// Send payment confirmation email
async sendPaymentConfirmation(to, name, amount, txnRef) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Payment Confirmation - Stackkin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .payment-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your payment has been successfully processed and confirmed.</p>
              
              <div class="payment-details">
                <h3>Payment Details:</h3>
                <p><strong>Amount:</strong> ₦${amount.toFixed(2)}</p>
                <p><strong>Transaction Reference:</strong> ${txnRef}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-NG')}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Completed</span></p>
              </div>
              
              <p>You can view the details of this transaction in your account dashboard.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/dashboard/transactions" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Transaction
                </a>
              </p>
              
              <div class="footer">
                <p>Best regards,<br>The Stackkin Team</p>
                <p>Need help? Contact our support team at <a href="mailto:${process.env.EMAIL_REPLY_TO}">${process.env.EMAIL_REPLY_TO}</a></p>
                <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('Send payment confirmation email error:', error);
      return false;
    }

    logger.info(`Payment confirmation email sent to: ${to}`);
    return true;
    
  } catch (error) {
    logger.error('Send payment confirmation email error:', error);
    return false;
  }
}

// Send transfer failure alert to admin
async sendTransferFailureAlert(to, userEmail, amount, txnRef, reason) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject: '🚨 Transfer Failure Alert - Stackkin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Transfer Failed 🚨</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3>⚠️ Attention Required: Bank Transfer Failed</h3>
                <p>A bank transfer has failed and requires your attention.</p>
              </div>
              
              <div class="details">
                <h4>Transfer Details:</h4>
                <p><strong>User Email:</strong> ${userEmail}</p>
                <p><strong>Amount:</strong> ₦${amount.toFixed(2)}</p>
                <p><strong>Transaction Reference:</strong> ${txnRef}</p>
                <p><strong>Failure Reason:</strong> ${reason}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString('en-NG')}</p>
              </div>
              
              <p><strong>Required Action:</strong></p>
              <ol>
                <li>Review the transaction in the admin dashboard</li>
                <li>Check Zainpay dashboard for more details</li>
                <li>Contact the user if necessary</li>
                <li>Investigate potential system issues</li>
              </ol>
              
              <div class="footer">
                <p>This is an automated alert from Stackkin Payment System.</p>
                <p>© ${new Date().getFullYear()} Stackkin. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('Send transfer failure alert error:', error);
      return false;
    }

    logger.info(`Transfer failure alert sent to: ${to}`);
    return true;
    
  } catch (error) {
    logger.error('Send transfer failure alert error:', error);
    return false;
  }
}
}

export default new EmailService();

// Export individual functions for convenience
export const sendVerificationEmail = (to, name, token) => 
  EmailService.sendVerificationEmail(to, name, token);

export const sendPasswordResetEmail = (to, name, token) => 
  EmailService.sendPasswordResetEmail(to, name, token);

export const sendWelcomeEmail = (to, name) => 
  EmailService.sendWelcomeEmail(to, name);

export const sendTwoFactorEmail = (to, name, code) => 
  EmailService.sendTwoFactorEmail(to, name, code);

export const sendSecurityAlert = (to, name, alertType, details) => 
  EmailService.sendSecurityAlert(to, name, alertType, details);