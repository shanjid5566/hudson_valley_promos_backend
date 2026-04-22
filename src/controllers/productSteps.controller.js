const productStepsService = require('../services/productSteps.service');

class ProductStepsController {
  /**
   * Get all step configurations
   * @route GET /api/admin/product-steps
   */
  async getAllConfigurations(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {};

      if (req.query.serviceId && req.query.serviceId !== 'ALL') {
        filters.serviceId = req.query.serviceId;
      }
      if (req.query.categoryId && req.query.categoryId !== 'ALL') {
        filters.categoryId = req.query.categoryId;
      }

      const result = await productStepsService.getAllConfigurations(page, limit, filters);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single configuration by ID
   * @route GET /api/admin/product-steps/:configurationId
   */
  async getConfigurationById(req, res) {
    try {
      const { configurationId } = req.params;
      const configuration = await productStepsService.getConfigurationById(configurationId);

      res.status(200).json({
        success: true,
        data: configuration
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
   * Get configuration by service and category
   * @route GET /api/admin/product-steps/service/:serviceId/category/:categoryId
   */
  async getConfigurationByServiceAndCategory(req, res) {
    try {
      const { serviceId, categoryId } = req.params;
      const configuration = await productStepsService.getConfigurationByServiceAndCategory(
        serviceId,
        categoryId
      );

      res.status(200).json({
        success: true,
        data: configuration
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
   * Create new step configuration
   * @route POST /api/admin/product-steps
   */
  async createConfiguration(req, res) {
    try {
      const { serviceId, categoryId, steps } = req.body;

      if (!serviceId || !categoryId) {
        return res.status(400).json({
          success: false,
          error: 'serviceId and categoryId are required'
        });
      }

      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one step is required'
        });
      }

      const configuration = await productStepsService.createConfiguration({
        serviceId,
        categoryId,
        steps
      });

      res.status(201).json({
        success: true,
        message: 'Configuration created successfully',
        data: configuration
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update configuration
   * @route PUT /api/admin/product-steps/:configurationId
   */
  async updateConfiguration(req, res) {
    try {
      const { configurationId } = req.params;
      const { steps } = req.body;

      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one step is required'
        });
      }

      const configuration = await productStepsService.updateConfiguration(configurationId, {
        steps
      });

      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: configuration
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
   * Delete configuration
   * @route DELETE /api/admin/product-steps/:configurationId
   */
  async deleteConfiguration(req, res) {
    try {
      const { configurationId } = req.params;
      const result = await productStepsService.deleteConfiguration(configurationId);

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

  /**
   * Reorder steps within configuration
   * @route PATCH /api/admin/product-steps/:configurationId/reorder
   */
  async reorderSteps(req, res) {
    try {
      const { configurationId } = req.params;
      const { steps } = req.body;

      if (!Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'steps array is required'
        });
      }

      const configuration = await productStepsService.reorderSteps(configurationId, steps);

      res.status(200).json({
        success: true,
        message: 'Steps reordered successfully',
        data: configuration
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

module.exports = new ProductStepsController();
