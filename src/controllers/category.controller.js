const categoryService = require('../services/category.service');

/**
 * Categories Controller (Public)
 * Handles HTTP requests for public category endpoints
 */
class CategoryController {
  /**
   * Get all categories with subcategories
   * @route GET /api/categories
   * @query {serviceId} - Optional filter by service
   */
  async getAllCategories(req, res, next) {
    try {
      const { serviceId } = req.query;
      const categories = await categoryService.getAllCategories(serviceId);

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
   * Get single category by ID with subcategories
   * @route GET /api/categories/:id
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);

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
}

module.exports = new CategoryController();
