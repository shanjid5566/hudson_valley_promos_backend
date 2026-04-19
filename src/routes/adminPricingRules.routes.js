const express = require('express');
const router = express.Router();
const adminPricingRulesController = require('../controllers/adminPricingRules.controller');
const { verifyAdminToken } = require('../middleware/admin.middleware');

/**
 * Admin Pricing Rules Routes
 * Base path: /api/admin/pricing-rules
 */

// GET all pricing rules (public)
router.get('/', adminPricingRulesController.getAllPricingRules.bind(adminPricingRulesController));

// GET single pricing rule by ID (public)
router.get('/:id', adminPricingRulesController.getPricingRuleById.bind(adminPricingRulesController));

// POST create new pricing rule (admin only)
router.post('/', verifyAdminToken, adminPricingRulesController.createPricingRule.bind(adminPricingRulesController));

// PUT update pricing rule (admin only)
router.put('/:id', verifyAdminToken, adminPricingRulesController.updatePricingRule.bind(adminPricingRulesController));

// DELETE pricing rule (admin only)
router.delete('/:id', verifyAdminToken, adminPricingRulesController.deletePricingRule.bind(adminPricingRulesController));

module.exports = router;
