/**
 * Mailer Utility
 * Handles sending emails via Nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User's name
 * @returns {Promise<Object>} Email send result
 */
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your OTP for Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            
            <p style="color: #666; font-size: 16px;">Hi ${userName},</p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for signing up! To complete your registration, please use the following One-Time Password (OTP) to verify your email address.
            </p>
            
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 4px; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">Your OTP Code:</p>
              <p style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Please note:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't request this verification, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              SlimeDoesGamez © 2025. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @returns {Promise<Object>} Email send result
 */
const sendWelcomeEmail = async (email, userName = 'User') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to SlimeDoesGamez!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to SlimeDoesGamez!</h2>
            
            <p style="color: #666; font-size: 16px;">Hi ${userName},</p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your email has been verified and your account is now active. You can now log in and start exploring our amazing products and services.
            </p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>Account Verified:</strong> Yes ✓<br>
                <strong>Email:</strong> ${email}
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.8;">
              <strong>Quick Start:</strong><br>
              • Browse our product catalog<br>
              • Add items to your cart<br>
              • Complete your first order
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://slimedoesgamez.com'}/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              SlimeDoesGamez © 2025. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail
};
