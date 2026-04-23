const express = require("express");
const router = express.Router();
const orderController = require("../controllers/userOrder.controller");
const { verifyUserOrAdminToken } = require("../middleware/admin.middleware");

/**
 * Public/User Order Routes
 * Base path: /api/orders
 */
// GET logged-in user's orders
router.get(
  "/my-orders",
  verifyUserOrAdminToken,
  orderController.getMyOrders.bind(orderController),
);

// POST create a new order
router.post(
  "/",
  verifyUserOrAdminToken,
  orderController.createOrder.bind(orderController),
);

module.exports = router;
