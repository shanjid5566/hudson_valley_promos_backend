const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/dashboard.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Dashboard Routes
 * Base path: /api/admin/dashboard
 * All routes require admin authentication
 */

// GET dashboard overview
router.get('/overview', verifyAdminToken, adminDashboardController.getDashboardOverview.bind(adminDashboardController));

module.exports = router;
