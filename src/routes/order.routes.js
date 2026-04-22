const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

/**
 * Public/User Order Routes
 * Base path: /api/orders
 */
router.post('/', verifyUserOrAdminToken, orderController.createOrder.bind(orderController));

module.exports = router;