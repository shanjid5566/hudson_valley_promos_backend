const express = require('express');
const router = express.Router();
const adminCategoriesController = require('../controllers/adminCategories.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Categories Routes
 * Base path: /api/admin/categories
 */

// GET all categories (public, optionally filtered by serviceId)
router.get('/', adminCategoriesController.getAllCategories.bind(adminCategoriesController));

// GET single category by ID (public)
router.get('/:id', adminCategoriesController.getCategoryById.bind(adminCategoriesController));

// POST create new category (admin only)
router.post('/', verifyAdminToken, adminCategoriesController.createCategory.bind(adminCategoriesController));

// PUT update category (admin only)
router.put('/:id', verifyAdminToken, adminCategoriesController.updateCategory.bind(adminCategoriesController));

// DELETE category (admin only)
router.delete('/:id', verifyAdminToken, adminCategoriesController.deleteCategory.bind(adminCategoriesController));

module.exports = router;
