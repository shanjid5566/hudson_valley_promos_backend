const adminMaterialsService = require('../services/adminMaterials.service');

/**
 * Admin Materials Controller
 * Handles HTTP requests for material management
 */
class AdminMaterialsController {
  /**
   * Get all materials
   * @route GET /api/admin/materials?offset=0&limit=10
   */
  async getAllMaterials(req, res, next) {
    try {
      const offset = Math.max(0, parseInt(req.query.offset) || 0);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));

      const result = await adminMaterialsService.getAllMaterials(offset, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          offset: result.offset,
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
   * Get materials by category ID
   * @route GET /api/admin/materials/category/:categoryId
   */
  async getMaterialsByCategoryId(req, res, next) {
    try {
      const { categoryId } = req.params;
      const materials = await adminMaterialsService.getMaterialsByCategoryId(categoryId);

      res.status(200).json({
        success: true,
        data: materials,
        count: materials.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single material by ID
   * @route GET /api/admin/materials/:id
   */
  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;
      const material = await adminMaterialsService.getMaterialById(id);

      res.status(200).json({
        success: true,
        data: material
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
   * Create new material
   * @route POST /api/admin/materials
   * @body {name, categoryId}
   */
  async createMaterial(req, res, next) {
    try {
      const { name, categoryId } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Material name is required'
        });
      }

      if (!categoryId || categoryId.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'categoryId is required'
        });
      }

      const material = await adminMaterialsService.createMaterial({
        name: name.trim(),
        categoryId: categoryId.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: material
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
   * Update material
   * @route PUT /api/admin/materials/:id
   * @body {name, categoryId}
   */
  async updateMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const { name, categoryId } = req.body;

      const material = await adminMaterialsService.updateMaterial(id, {
        name,
        categoryId
      });

      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: material
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
   * Delete material
   * @route DELETE /api/admin/materials/:id
   */
  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminMaterialsService.deleteMaterial(id);

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

module.exports = new AdminMaterialsController();
