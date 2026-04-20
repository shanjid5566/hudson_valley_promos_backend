const adminAttributesService = require('../services/attributes.service');

class AdminAttributesController {
  async getAllAttributes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {};

      // Extract optional filters
      if (req.query.serviceId && req.query.serviceId !== 'ALL') {
        filters.serviceId = req.query.serviceId;
      }
      if (req.query.categoryId && req.query.categoryId !== 'ALL') {
        filters.categoryId = req.query.categoryId;
      }

      const result = await adminAttributesService.getAllAttributes(page, limit, filters);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getAttributesByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const attributes = await adminAttributesService.getAttributesByCategory(categoryId);
      res.status(200).json({ success: true, data: attributes });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createAttribute(req, res) {
    try {
      const { name, type, categoryId, options } = req.body;

      if (!name || !type || !categoryId || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ success: false, error: 'Name, type, categoryId, and at least one option are required.' });
      }

      const attribute = await adminAttributesService.createAttribute(req.body);
      res.status(201).json({ success: true, message: 'Attribute created successfully', data: attribute });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteAttribute(req, res) {
    try {
      const { id } = req.params;
      const result = await adminAttributesService.deleteAttribute(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AdminAttributesController();