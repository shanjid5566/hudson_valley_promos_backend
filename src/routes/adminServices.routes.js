const express = require('express');
const router = express.Router();
const adminServicesController = require('../controllers/adminServices.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Services Routes
 * Base path: /api/admin/services
 */

// GET all services (public)
router.get('/', adminServicesController.getAllServices.bind(adminServicesController));

// GET single service by ID (public)
router.get('/:id', adminServicesController.getServiceById.bind(adminServicesController));

// POST create new service (admin only)
router.post('/', verifyAdminToken, adminServicesController.createService.bind(adminServicesController));

// PUT update service (admin only)
router.put('/:id', verifyAdminToken, adminServicesController.updateService.bind(adminServicesController));

// DELETE service (admin only)
router.delete('/:id', verifyAdminToken, adminServicesController.deleteService.bind(adminServicesController));

module.exports = router;
