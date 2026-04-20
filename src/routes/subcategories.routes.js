const express = require('express');
const router = express.Router();
const adminSubcategoriesController = require('../controllers/subcategories.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Subcategories Routes
 * Base path: /api/admin/subcategories
 */

// GET all subcategories (public)
router.get('/', adminSubcategoriesController.getAllSubcategories.bind(adminSubcategoriesController));

// GET single subcategory by ID (public)
router.get('/:id', adminSubcategoriesController.getSubcategoryById.bind(adminSubcategoriesController));

// POST create new subcategory (admin only)
router.post('/', verifyAdminToken, adminSubcategoriesController.createSubcategory.bind(adminSubcategoriesController));

// PUT update subcategory (admin only)
router.put('/:id', verifyAdminToken, adminSubcategoriesController.updateSubcategory.bind(adminSubcategoriesController));

// DELETE subcategory (admin only)
router.delete('/:id', verifyAdminToken, adminSubcategoriesController.deleteSubcategory.bind(adminSubcategoriesController));

module.exports = router;
