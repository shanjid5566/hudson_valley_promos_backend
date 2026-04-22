const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

/**
 * User Cart Routes
 * Base path: /api/cart
 * All routes require authentication
 */

// GET user's cart
router.get('/', verifyUserOrAdminToken, cartController.getCart.bind(cartController));

// POST add item to cart
router.post('/add', verifyUserOrAdminToken, cartController.addToCart.bind(cartController));

// PUT update cart item quantity
router.put('/item/:itemId', verifyUserOrAdminToken, cartController.updateCartItem.bind(cartController));

// DELETE remove item from cart
router.delete('/item/:itemId', verifyUserOrAdminToken, cartController.removeCartItem.bind(cartController));

// DELETE clear entire cart
router.delete('/clear', verifyUserOrAdminToken, cartController.clearCart.bind(cartController));

module.exports = router;