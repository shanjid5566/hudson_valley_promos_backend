const adminService = require('../services/admin.service');

/**
 * Admin Controller
 * Handles HTTP requests for admin operations
 */
class AdminController {
  // ==========================================
  // SERVICE ENDPOINTS
  // ==========================================

  /**
   * Get all services
   * @route GET /api/admin/services
   */
  async getAllServices(req, res, next) {
    try {
      const services = await adminService.getAllServices();

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
      const service = await adminService.getServiceById(id);

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

      const service = await adminService.createService({
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
   * @body {name, slug, description, icon}
   */
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, description, icon } = req.body;

      const service = await adminService.updateService(id, {
        name,
        slug,
        description,
        icon
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

      const result = await adminService.deleteService(id);

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

  // ==========================================
  // CATEGORY ENDPOINTS
  // ==========================================

  /**
   * Get all categories
   * @route GET /api/admin/categories
   * @query {serviceId} - Optional filter by service
   */
  async getAllCategories(req, res, next) {
    try {
      const { serviceId } = req.query;
      const categories = await adminService.getAllCategories(serviceId);

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
      const category = await adminService.getCategoryById(id);

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
   * @body {name, description, serviceId, parentId} - slug is auto-generated from name
   */
  async createCategory(req, res, next) {
    try {
      const { name, description, serviceId, parentId } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
      }

      // Auto-generate slug from name
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');

      const category = await adminService.createCategory({
        name: name.trim(),
        slug,
        description: description || null,
        serviceId,
        parentId
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

      const category = await adminService.updateCategory(id, {
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

      const result = await adminService.deleteCategory(id);

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

  /**
   * Get subcategories of a category
   * @route GET /api/admin/categories/:id/subcategories
   */
  async getSubcategoriesByCategory(req, res, next) {
    try {
      const { id } = req.params;
      const subcategories = await adminService.getSubcategoriesByCategory(id);

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

  // ==========================================
  // SUBCATEGORY ENDPOINTS
  // ==========================================

  /**
   * Get all subcategories
   * @route GET /api/admin/subcategories
   */
  async getAllSubcategories(req, res, next) {
    try {
      const subcategories = await adminService.getAllSubcategories();

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
      const subcategory = await adminService.getSubcategoryById(id);

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
   * @body {name, description, categoryId} - slug is auto-generated from name
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

      const subcategory = await adminService.createSubcategory({
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

      const subcategory = await adminService.updateSubcategory(id, {
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

      const result = await adminService.deleteSubcategory(id);

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

  // ==========================================
  // SUBCATEGORY ENDPOINTS
  // ==========================================

  /**
   * Get single subcategory by ID
   * @route GET /api/admin/subcategories/:id
   */
  async getSubcategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const subcategory = await adminService.getSubcategoryById(id);

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
   * @body {name, description, categoryId} - slug is auto-generated from name
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

      const subcategory = await adminService.createSubcategory({
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

      const subcategory = await adminService.updateSubcategory(id, {
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

      const result = await adminService.deleteSubcategory(id);

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

module.exports = new AdminController();
