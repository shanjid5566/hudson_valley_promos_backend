const adminPricingRulesService = require('../services/adminPricingRules.service');

/**
 * Admin Pricing Rules Controller
 * Handles HTTP requests for pricing rule management
 */
class AdminPricingRulesController {
  /**
   * Get all pricing rules
   * @route GET /api/admin/pricing-rules?page=1&limit=10
   */
  async getAllPricingRules(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

      const result = await adminPricingRulesService.getAllPricingRules(page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single pricing rule by ID
   * @route GET /api/admin/pricing-rules/:id
   */
  async getPricingRuleById(req, res, next) {
    try {
      const { id } = req.params;
      const rule = await adminPricingRulesService.getPricingRuleById(id);

      res.status(200).json({
        success: true,
        data: rule
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new pricing rule
   * @route POST /api/admin/pricing-rules
   * @body {name, type, value, description}
   */
  async createPricingRule(req, res, next) {
    try {
      const { name, type, value, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Rule name is required'
        });
      }

      if (!type || !['FIXED', 'PERCENTAGE'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Type is required and must be either FIXED or PERCENTAGE'
        });
      }

      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          error: 'Value is required'
        });
      }

      const rule = await adminPricingRulesService.createPricingRule({
        name: name.trim(),
        type,
        value,
        description: description || null
      });

      res.status(201).json({
        success: true,
        message: 'Pricing rule created successfully',
        data: rule
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update pricing rule
   * @route PUT /api/admin/pricing-rules/:id
   * @body {name, type, value, description}
   */
  async updatePricingRule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, value, description } = req.body;

      const rule = await adminPricingRulesService.updatePricingRule(id, {
        name,
        type,
        value,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Pricing rule updated successfully',
        data: rule
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete pricing rule
   * @route DELETE /api/admin/pricing-rules/:id
   */
  async deletePricingRule(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminPricingRulesService.deletePricingRule(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminPricingRulesController();
