const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

/**
 * Public Products Routes
 * Base path: /api/products
 */

// GET all products with filters (public)
router.get('/', productController.getPublicProducts.bind(productController));

// GET single product by ID (public)
router.get('/:id', productController.getPublicProductById.bind(productController));

module.exports = router;
