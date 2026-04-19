const adminServicesService = require('../services/adminServices.service');

/**
 * Admin Services Controller
 * Handles HTTP requests for service management
 */
class AdminServicesController {
  /**
   * Get all services
   * @route GET /api/admin/services
   */
  async getAllServices(req, res, next) {
    try {
      const services = await adminServicesService.getAllServices();

      res.status(200).json({
        success: true,
        data: services,
        count: services.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single service by ID
   * @route GET /api/admin/services/:id
   */
  async getServiceById(req, res, next) {
    try {
      const { id } = req.params;
      const service = await adminServicesService.getServiceById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new service
   * @route POST /api/admin/services
   * @body {name, description} - slug is auto-generated from name
   */
  async createService(req, res, next) {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Service name is required'
        });
      }

      // Auto-generate slug from name
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

      const service = await adminServicesService.createService({
        name: name.trim(),
        slug,
        description: description || null
      });

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service
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
   * Update service
   * @route PUT /api/admin/services/:id
   * @body {name, description}
   */
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const service = await adminServicesService.updateService(id, {
        name,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: service
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
   * Delete service
   * @route DELETE /api/admin/services/:id
   */
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminServicesService.deleteService(id);

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

module.exports = new AdminServicesController();
