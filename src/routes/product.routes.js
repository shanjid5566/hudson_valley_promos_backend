const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');
const { upload, buildImageUrls } = require('../middleware/upload.middleware');

/**
 * Admin Product Routes
 * Base path: /api/admin/products
 */

// GET all products with search and filters (admin only)
router.get('/', verifyAdminToken, productController.getAllProducts.bind(productController));

// GET single product by ID (admin only)
router.get('/:id', verifyAdminToken, productController.getProductById.bind(productController));

// POST create new product with image uploads (admin only)
router.post(
  '/',
  verifyAdminToken,
  upload.array('images', 5),
  buildImageUrls,
  productController.createProduct.bind(productController)
);

// PUT update product with optional image uploads (admin only)
router.put(
  '/:id',
  verifyAdminToken,
  upload.array('images', 5),
  buildImageUrls,
  productController.updateProduct.bind(productController)
);

// DELETE product (admin only)
router.delete('/:id', verifyAdminToken, productController.deleteProduct.bind(productController));

module.exports = router;
