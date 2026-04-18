const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otp');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/mailer');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

/**
 * User Service Layer
 * Handles business logic and database operations for users
 */
class UserService {
  /**
   * Login user with email and password and return JWT token
   * @param {Object} credentials - User login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login result with JWT token
   */
  async loginUser(credentials) {
    const { email, password } = credentials;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new Error('Email not found');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Password does not match');
      }

      if (!user.isEmailVerified) {
        throw new Error('Please verify your email before login');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Login successful',
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Get all users from database
   * @returns {Promise<Array>} List of users (excluding passwords)
   */
  async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return users;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Get a single user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return user;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Register a new customer
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.firstName - User first name
   * @param {string} userData.lastName - User last name
   * @param {string} userData.phone - User phone (optional)
   * @returns {Promise<Object>} Created user and OTP sent confirmation
   */
  async registerCustomer(userData) {
    const { email, password, firstName, lastName, phone } = userData;

    try {
      // Validate input
      if (!email || !password || !firstName) {
        throw new Error('Email, password, and first name are required');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        if (existingUser.isEmailVerified) {
          throw new Error('Email already registered. Please login or use a different email.');
        } else {
          // If user exists but not verified, update password and resend OTP
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
          });
        }
      } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName: lastName || null,
            phone: phone || null,
            role: 'CUSTOMER',
            isEmailVerified: false
          }
        });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiryTime = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

      // Create or update OTP verification record
      await prisma.oTPVerification.upsert({
        where: { userId: (await prisma.user.findUnique({ where: { email } })).id },
        update: {
          otp,
          expiresAt: expiryTime,
          attempts: 0
        },
        create: {
          user: { connect: { email } },
          otp,
          expiresAt: expiryTime,
          attempts: 0
        }
      });

      // Send OTP email
      await sendOTPEmail(email, otp, firstName);

      return {
        success: true,
        message: 'Registration successful! OTP sent to your email.',
        email,
        firstName,
        lastName: lastName || null,
        phone: phone || null
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Verify OTP and mark email as verified
   * @param {string} email - User email
   * @param {string} otp - OTP code to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyOTP(email, otp) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { otpVerification: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      const otpRecord = user.otpVerification;

      if (!otpRecord) {
        throw new Error('No OTP found. Please request a new OTP.');
      }

      // Check if OTP is expired
      if (isOTPExpired(otpRecord.expiresAt)) {
        throw new Error('OTP has expired. Please request a new OTP.');
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        await prisma.oTPVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        });
        throw new Error('Invalid OTP. Please try again.');
      }

      // Mark email as verified
      await prisma.user.update({
        where: { email },
        data: { isEmailVerified: true }
      });

      // Delete OTP record
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id }
      });

      // Send welcome email
      await sendWelcomeEmail(email, user.firstName);

      return {
        success: true,
        message: 'Email verified successfully!',
        email,
        userId: user.id
      };
    } catch (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }
  }

  /**
   * Resend OTP to email
   * @param {string} email - User email
   * @returns {Promise<Object>} Resend result
   */
  async resendOTP(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiryTime = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

      // Update OTP record
      await prisma.oTPVerification.update({
        where: { userId: user.id },
        data: {
          otp,
          expiresAt: expiryTime,
          attempts: 0
        }
      });

      // Send OTP email
      await sendOTPEmail(email, otp, user.firstName);

      return {
        success: true,
        message: 'New OTP sent to your email.',
        email
      };
    } catch (error) {
      throw new Error(`Failed to resend OTP: ${error.message}`);
    }
  }

  /**
   * Create a new user (General purpose)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      const { email, password, firstName, lastName, phone } = userData;

      if (!email || !password || !firstName) {
        throw new Error('Email, password, and first name are required');
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName: lastName || null,
          phone: phone || null,
          role: 'CUSTOMER'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return newUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update an existing user
   * @param {string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(id, userData) {
    try {
      const updateData = { ...userData };

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteUser(id) {
    try {
      await prisma.user.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'User deleted successfully',
        userId: id
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Send password reset OTP to user's email
   * @param {string} email - User email
   * @returns {Promise<Object>} Result with success message
   */
  async forgotPassword(email) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('Email not found');
      }

      if (!user.isEmailVerified) {
        throw new Error('Please verify your email first before resetting password');
      }

      // Generate OTP
      const otp = generateOTP();
      const expiryTime = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

      // Create or update OTP verification record for password reset
      await prisma.oTPVerification.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          otp,
          expiresAt: expiryTime,
          attempts: 0
        },
        update: {
          otp,
          expiresAt: expiryTime,
          attempts: 0
        }
      });

      // Send password reset OTP email
      await sendPasswordResetEmail(email, otp, user.firstName);

      return {
        success: true,
        message: 'Password reset code sent to your email.',
        email
      };
    } catch (error) {
      throw new Error(`Forgot password failed: ${error.message}`);
    }
  }

  /**
   * Verify password reset OTP
   * @param {string} email - User email
   * @param {string} otp - OTP code to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyResetOTP(email, otp) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { otpVerification: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const otpRecord = user.otpVerification;

      if (!otpRecord) {
        throw new Error('No OTP found. Please request a new password reset code.');
      }

      // Check if OTP is expired
      if (isOTPExpired(otpRecord.expiresAt)) {
        throw new Error('OTP has expired. Please request a new password reset code.');
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        throw new Error('Maximum OTP attempts exceeded. Please request a new password reset code.');
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        await prisma.oTPVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        });
        throw new Error('Invalid OTP. Please try again.');
      }

      // Mark as verified - don't delete yet, keep for reset password validation
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { isVerified: true }
      });

      return {
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        email,
        userId: user.id
      };
    } catch (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }
  }

  /**
   * Reset password with verified OTP
   * @param {string} email - User email
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(email, newPassword) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { otpVerification: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const otpRecord = user.otpVerification;

      if (!otpRecord) {
        throw new Error('No OTP found. Please verify your email first.');
      }

      // Check if OTP has been verified
      if (!otpRecord.isVerified) {
        throw new Error('Please verify your OTP first before resetting password.');
      }

      // Check if OTP is expired
      if (isOTPExpired(otpRecord.expiresAt)) {
        throw new Error('OTP has expired. Please request a new password reset code.');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });

      // Delete OTP record
      await prisma.oTPVerification.delete({
        where: { id: otpRecord.id }
      });

      return {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
        email
      };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }
}

module.exports = new UserService();
