const adminCategoriesService = require('../services/categories.service');

/**
 * Admin Categories Controller
 * Handles HTTP requests for category management
 */
class AdminCategoriesController {
  /**
   * Get all categories
   * @route GET /api/admin/categories
   * @query {serviceId} - Optional filter by service
   */
  async getAllCategories(req, res, next) {
    try {
      const { serviceId } = req.query;
      const categories = await adminCategoriesService.getAllCategories(serviceId);

      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single category by ID
   * @route GET /api/admin/categories/:id
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await adminCategoriesService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category
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
   * Create new category
   * @route POST /api/admin/categories
   * @body {name, description, serviceId}
   */
  async createCategory(req, res, next) {
    try {
      const { name, description, serviceId } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      // Auto-generate slug from name
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

      const category = await adminCategoriesService.createCategory({
        name: name.trim(),
        slug,
        description: description || null,
        serviceId
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
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
   * Update category
   * @route PUT /api/admin/categories/:id
   * @body {name, description}
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const category = await adminCategoriesService.updateCategory(id, {
        name,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
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
   * Delete category
   * @route DELETE /api/admin/categories/:id
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminCategoriesService.deleteCategory(id);

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

module.exports = new AdminCategoriesController();
