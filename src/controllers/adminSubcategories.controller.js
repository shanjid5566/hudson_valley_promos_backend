const adminSubcategoriesService = require('../services/adminSubcategories.service');

/**
 * Admin Subcategories Controller
 * Handles HTTP requests for subcategory management
 */
class AdminSubcategoriesController {
  /**
   * Get all subcategories
   * @route GET /api/admin/subcategories
   */
  async getAllSubcategories(req, res, next) {
    try {
      const subcategories = await adminSubcategoriesService.getAllSubcategories();

      res.status(200).json({
        success: true,
        data: subcategories,
        count: subcategories.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get subcategories by category
   * @route GET /api/admin/categories/:id/subcategories
   */
  async getSubcategoriesByCategory(req, res, next) {
    try {
      const { id } = req.params;
      const subcategories = await adminSubcategoriesService.getSubcategoriesByCategory(id);

      res.status(200).json({
        success: true,
        data: subcategories,
        count: subcategories.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single subcategory by ID
   * @route GET /api/admin/subcategories/:id
   */
  async getSubcategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const subcategory = await adminSubcategoriesService.getSubcategoryById(id);

      res.status(200).json({
        success: true,
        data: subcategory
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
   * Create new subcategory
   * @route POST /api/admin/subcategories
   * @body {name, description, categoryId}
   */
  async createSubcategory(req, res, next) {
    try {
      const { name, description, categoryId } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Subcategory name is required'
        });
      }

      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: 'categoryId is required'
        });
      }

      // Auto-generate slug from name
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

      const subcategory = await adminSubcategoriesService.createSubcategory({
        name: name.trim(),
        slug,
        description: description || null,
        categoryId
      });

      res.status(201).json({
        success: true,
        message: 'Subcategory created successfully',
        data: subcategory
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 
                        error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update subcategory
   * @route PUT /api/admin/subcategories/:id
   * @body {name, description}
   */
  async updateSubcategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const subcategory = await adminSubcategoriesService.updateSubcategory(id, {
        name,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Subcategory updated successfully',
        data: subcategory
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
   * Delete subcategory
   * @route DELETE /api/admin/subcategories/:id
   */
  async deleteSubcategory(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminSubcategoriesService.deleteSubcategory(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('associated') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminSubcategoriesController();
