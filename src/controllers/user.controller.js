const userService = require('../services/user.service');

/**
 * User Controller Layer
 * Handles HTTP requests and responses for user-related endpoints
 */
class UserController {
  /**
   * Login with email and password
   * @route POST /api/users/auth/login
   * @body {Object} - { email, password }
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      const result = await userService.loginUser({ email, password });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          token: result.token,
          user: result.user
        }
      });
    } catch (error) {
      const message = error.message || '';
      const statusCode =
        message.includes('Email not found') ? 404 :
        message.includes('Password does not match') ? 401 :
        message.includes('verify your email') ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Get all users
   * @route GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single user by ID
   * @route GET /api/users/:id
   * Authorization: Regular users can only access their own profile, admins can access any profile
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check authorization: regular users can only access their own profile
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this user profile'
        });
      }
      
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new customer
   * @route POST /api/users/auth/register
   * @body {Object} - { email, password, firstName, lastName, phone }
   */
  async registerCustomer(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Validation
      if (!email || !password || !firstName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and first name are required'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Password validation (minimum 6 characters)
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long'
        });
      }

      const result = await userService.registerCustomer({
        email,
        password,
        firstName,
        lastName,
        phone
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          phone: result.phone
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('already registered') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify OTP and activate email
   * @route POST /api/users/auth/verify-otp
   * @body {Object} - { email, otp }
   */
  async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      // Validation
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      if (otp.length !== 5 || isNaN(otp)) {
        return res.status(400).json({
          success: false,
          error: 'OTP must be a 5-digit number'
        });
      }

      const result = await userService.verifyOTP(email, otp);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          userId: result.userId
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('Maximum OTP attempts') ? 429 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Resend OTP to email
   * @route POST /api/users/auth/resend-otp
   * @body {Object} - { email }
   */
  async resendOTP(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const result = await userService.resendOTP(email);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { email: result.email }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new user (General purpose)
   * @route POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;
      
      // Basic validation
      if (!userData.name || !userData.email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
      }
      
      const newUser = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing user
   * @route PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const updatedUser = await userService.updateUser(id, userData);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * @route DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send password reset OTP to email
   * @route POST /api/users/auth/forgot-password
   * @body {Object} - { email }
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      const result = await userService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('Email not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify password reset OTP
   * @route POST /api/users/auth/verify-reset-otp
   * @body {Object} - { email, otp }
   */
  async verifyResetOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      if (otp.length !== 5 || isNaN(otp)) {
        return res.status(400).json({
          success: false,
          error: 'OTP must be a 5-digit number'
        });
      }

      const result = await userService.verifyResetOTP(email, otp);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          userId: result.userId
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('Maximum OTP attempts') ? 429 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reset password with verified OTP
   * @route POST /api/users/auth/reset-password
   * @body {Object} - { email, newPassword, confirmPassword }
   */
  async resetPassword(req, res, next) {
    try {
      const { email, newPassword, confirmPassword } = req.body;

      if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Email, new password, and confirm password are required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long'
        });
      }

      const result = await userService.resetPassword(email, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email
        }
      });
    } catch (error) {
      const statusCode = 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
