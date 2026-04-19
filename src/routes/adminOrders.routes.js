const express = require('express');
const router = express.Router();
const adminOrdersController = require('../controllers/adminOrders.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Orders Routes
 * Base path: /api/admin/orders
 * All routes require admin authentication
 */

// GET order statistics (must be before /:orderId route)
router.get('/stats', verifyAdminToken, adminOrdersController.getOrderStats.bind(adminOrdersController));

// GET all available order statuses
router.get('/statuses', verifyAdminToken, adminOrdersController.getAllOrderStatuses.bind(adminOrdersController));

// GET all orders with pagination and filters
router.get('/', verifyAdminToken, adminOrdersController.getAllOrders.bind(adminOrdersController));

// GET single order by ID
router.get('/:orderId', verifyAdminToken, adminOrdersController.getOrderById.bind(adminOrdersController));

// PUT update order status
router.put('/:orderId/status', verifyAdminToken, adminOrdersController.updateOrderStatus.bind(adminOrdersController));

// GET download file from order customization
router.get('/:orderId/files/:fileName', verifyAdminToken, adminOrdersController.downloadFile.bind(adminOrdersController));

module.exports = router;
