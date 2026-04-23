const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyAdminToken, verifyUserOrAdminToken } = require('../middleware/admin.middleware');

/**
 * User Routes
 * Base path: /api/users
 */

// ==========================================
// Authentication Routes (Public)
// ==========================================

// POST register new customer
// @route POST /api/users/auth/register
// @body {email, password, firstName, lastName, phone}
router.post('/auth/register', userController.registerCustomer.bind(userController));

// POST login user
// @route POST /api/users/auth/login
// @body {email, password}
router.post('/auth/login', userController.login.bind(userController));

// POST verify OTP
// @route POST /api/users/auth/verify-otp
// @body {email, otp}
router.post('/auth/verify-otp', userController.verifyOTP.bind(userController));

// POST resend OTP
// @route POST /api/users/auth/resend-otp
// @body {email}
router.post('/auth/resend-otp', userController.resendOTP.bind(userController));

// POST forgot password - send reset OTP
// @route POST /api/users/auth/forgot-password
// @body {email}
router.post('/auth/forgot-password', userController.forgotPassword.bind(userController));

// POST verify reset OTP
// @route POST /api/users/auth/verify-reset-otp
// @body {email, otp}
router.post('/auth/verify-reset-otp', userController.verifyResetOTP.bind(userController));

// POST reset password
// @route POST /api/users/auth/reset-password
// @body {email, otp, newPassword, confirmPassword}
router.post('/auth/reset-password', userController.resetPassword.bind(userController));

// ==========================================
// User Management Routes (Protected - Admin Only)
// ==========================================

// GET all users
router.get('/', verifyAdminToken, userController.getAllUsers.bind(userController));

// GET single user by ID (allowed for user to get their own profile and for admins to get any profile)
router.get('/:id', verifyUserOrAdminToken, userController.getUserById.bind(userController));

// POST create new user
router.post('/', verifyAdminToken, userController.createUser.bind(userController));

// PUT update existing user (users can update their own profile, admins can update any user)
router.put('/:id', verifyUserOrAdminToken, userController.updateUser.bind(userController));

// PUT change password for authenticated user or admin
router.put('/change-password', verifyUserOrAdminToken, userController.changePassword.bind(userController));

// DELETE user
router.delete('/:id', verifyAdminToken, userController.deleteUser.bind(userController));

module.exports = router;
