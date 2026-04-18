const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Routes
 * Base path: /api/admin
 */

// ==========================================
// Service Management Routes (Admin Only)
// ==========================================

// GET all services (public)
// @route GET /api/admin/services
router.get('/services', adminController.getAllServices.bind(adminController));

// GET single service by ID (public)
// @route GET /api/admin/services/:id
router.get('/services/:id', adminController.getServiceById.bind(adminController));

// POST create new service (admin only)
// @route POST /api/admin/services
// @body {name, slug, description, icon}
router.post('/services', verifyAdminToken, adminController.createService.bind(adminController));

// PUT update service (admin only)
// @route PUT /api/admin/services/:id
// @body {name, slug, description, icon}
router.put('/services/:id', verifyAdminToken, adminController.updateService.bind(adminController));

// DELETE service (admin only)
// @route DELETE /api/admin/services/:id
router.delete('/services/:id', verifyAdminToken, adminController.deleteService.bind(adminController));

// ==========================================
// Category Management Routes (Admin Only)
// ==========================================

// GET all categories (public, optionally filtered by serviceId)
// @route GET /api/admin/categories
// @query {serviceId}
router.get('/categories', adminController.getAllCategories.bind(adminController));

// GET single category by ID (public)
// @route GET /api/admin/categories/:id
router.get('/categories/:id', adminController.getCategoryById.bind(adminController));

// POST create new category (admin only)
// @route POST /api/admin/categories
// @body {name, description, serviceId}
router.post('/categories', verifyAdminToken, adminController.createCategory.bind(adminController));

// PUT update category (admin only)
// @route PUT /api/admin/categories/:id
// @body {name, description}
router.put('/categories/:id', verifyAdminToken, adminController.updateCategory.bind(adminController));

// DELETE category (admin only)
// @route DELETE /api/admin/categories/:id
router.delete('/categories/:id', verifyAdminToken, adminController.deleteCategory.bind(adminController));

// GET subcategories of a category (public)
// @route GET /api/admin/categories/:id/subcategories
router.get('/categories/:id/subcategories', adminController.getSubcategoriesByCategory.bind(adminController));

// ==========================================
// Subcategory Management Routes (Admin Only)
// ==========================================

// GET all subcategories (public)
// @route GET /api/admin/subcategories
router.get('/subcategories', adminController.getAllSubcategories.bind(adminController));

// GET single subcategory by ID (public)
// @route GET /api/admin/subcategories/:id
router.get('/subcategories/:id', adminController.getSubcategoryById.bind(adminController));

// POST create new subcategory (admin only)
// @route POST /api/admin/subcategories
// @body {name, description, categoryId} - slug is auto-generated from name
router.post('/subcategories', verifyAdminToken, adminController.createSubcategory.bind(adminController));

// PUT update subcategory (admin only)
// @route PUT /api/admin/subcategories/:id
// @body {name, description}
router.put('/subcategories/:id', verifyAdminToken, adminController.updateSubcategory.bind(adminController));

// DELETE subcategory (admin only)
// @route DELETE /api/admin/subcategories/:id
router.delete('/subcategories/:id', verifyAdminToken, adminController.deleteSubcategory.bind(adminController));

module.exports = router;
