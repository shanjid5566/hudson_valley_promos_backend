const express = require('express');
const router = express.Router();
const adminPrintingMethodsController = require('../controllers/adminPrintingMethods.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Printing Methods Routes
 * Base path: /api/admin/printing-methods
 */

// GET all printing methods with pagination (public)
router.get('/', adminPrintingMethodsController.getAllPrintingMethods.bind(adminPrintingMethodsController));

// GET single printing method by ID (public)
router.get('/:id', adminPrintingMethodsController.getPrintingMethodById.bind(adminPrintingMethodsController));

// POST create new printing method (admin only)
router.post('/', verifyAdminToken, adminPrintingMethodsController.createPrintingMethod.bind(adminPrintingMethodsController));

// PUT update printing method (admin only)
router.put('/:id', verifyAdminToken, adminPrintingMethodsController.updatePrintingMethod.bind(adminPrintingMethodsController));

// DELETE printing method (admin only)
router.delete('/:id', verifyAdminToken, adminPrintingMethodsController.deletePrintingMethod.bind(adminPrintingMethodsController));

module.exports = router;
