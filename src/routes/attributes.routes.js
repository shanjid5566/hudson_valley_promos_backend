const express = require('express');
const router = express.Router();
const adminAttributesController = require('../controllers/attributes.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

// GET all attributes with their options
router.get('/', verifyAdminToken, adminAttributesController.getAllAttributes.bind(adminAttributesController));

// GET attributes by category ID (Used in the Add Product Modal)
router.get('/category/:categoryId', verifyAdminToken, adminAttributesController.getAttributesByCategory.bind(adminAttributesController));

// POST create a new dynamic attribute
router.post('/', verifyAdminToken, adminAttributesController.createAttribute.bind(adminAttributesController));

// DELETE an attribute
router.delete('/:id', verifyAdminToken, adminAttributesController.deleteAttribute.bind(adminAttributesController));

module.exports = router;