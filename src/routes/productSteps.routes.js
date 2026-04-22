const express = require('express');
const router = express.Router();
const productStepsController = require('../controllers/productSteps.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Product Steps Configuration Routes
 * Base path: /api/admin/product-steps
 */

// GET all configurations with filters
router.get(
  '/',
  verifyAdminToken,
  productStepsController.getAllConfigurations.bind(productStepsController)
);

// GET single configuration by ID
router.get(
  '/:configurationId',
  verifyAdminToken,
  productStepsController.getConfigurationById.bind(productStepsController)
);

// GET configuration by service and category
router.get(
  '/service/:serviceId/category/:categoryId',
  verifyAdminToken,
  productStepsController.getConfigurationByServiceAndCategory.bind(productStepsController)
);

// POST create new configuration
router.post(
  '/',
  verifyAdminToken,
  productStepsController.createConfiguration.bind(productStepsController)
);

// PUT update configuration
router.put(
  '/:configurationId',
  verifyAdminToken,
  productStepsController.updateConfiguration.bind(productStepsController)
);

// PATCH reorder steps
router.patch(
  '/:configurationId/reorder',
  verifyAdminToken,
  productStepsController.reorderSteps.bind(productStepsController)
);

// DELETE configuration
router.delete(
  '/:configurationId',
  verifyAdminToken,
  productStepsController.deleteConfiguration.bind(productStepsController)
);

module.exports = router;
