const adminPrintingMethodsService = require('../services/adminPrintingMethods.service');

/**
 * Admin Printing Methods Controller
 * Handles HTTP requests for printing method management
 */
class AdminPrintingMethodsController {
  /**
   * Get all printing methods
   * @route GET /api/admin/printing-methods?page=1&limit=10
   */
  async getAllPrintingMethods(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

      const result = await adminPrintingMethodsService.getAllPrintingMethods(page, limit);

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
   * Get single printing method by ID
   * @route GET /api/admin/printing-methods/:id
   */
  async getPrintingMethodById(req, res, next) {
    try {
      const { id } = req.params;
      const method = await adminPrintingMethodsService.getPrintingMethodById(id);

      res.status(200).json({
        success: true,
        data: method
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
   * Create new printing method
   * @route POST /api/admin/printing-methods
   * @body {name, description}
   */
  async createPrintingMethod(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Printing method name is required'
        });
      }

      const method = await adminPrintingMethodsService.createPrintingMethod({
        name: name.trim(),
        description: description ? description.trim() : null
      });

      res.status(201).json({
        success: true,
        message: 'Printing method created successfully',
        data: method
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
   * Update printing method
   * @route PUT /api/admin/printing-methods/:id
   * @body {name, description}
   */
  async updatePrintingMethod(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const method = await adminPrintingMethodsService.updatePrintingMethod(id, {
        name,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Printing method updated successfully',
        data: method
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
   * Delete printing method
   * @route DELETE /api/admin/printing-methods/:id
   */
  async deletePrintingMethod(req, res, next) {
    try {
      const { id } = req.params;

      await adminPrintingMethodsService.deletePrintingMethod(id);

      res.status(200).json({
        success: true,
        message: 'Printing method deleted successfully'
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

module.exports = new AdminPrintingMethodsController();
