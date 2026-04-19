const express = require('express');
const router = express.Router();
const adminMaterialsController = require('../controllers/adminMaterials.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Materials Routes
 * Base path: /api/admin/materials
 */

// GET all materials (public)
router.get('/', adminMaterialsController.getAllMaterials.bind(adminMaterialsController));

// GET materials by category (public)
router.get('/category/:categoryId', adminMaterialsController.getMaterialsByCategoryId.bind(adminMaterialsController));

// GET single material by ID (public)
router.get('/:id', adminMaterialsController.getMaterialById.bind(adminMaterialsController));

// POST create new material (admin only)
router.post('/', verifyAdminToken, adminMaterialsController.createMaterial.bind(adminMaterialsController));

// PUT update material (admin only)
router.put('/:id', verifyAdminToken, adminMaterialsController.updateMaterial.bind(adminMaterialsController));

// DELETE material (admin only)
router.delete('/:id', verifyAdminToken, adminMaterialsController.deleteMaterial.bind(adminMaterialsController));

module.exports = router;
