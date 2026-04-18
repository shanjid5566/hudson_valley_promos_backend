const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

/**
 * Admin Service Layer - Refactored for separate Category and Subcategory models
 * Service → Category → Subcategory hierarchy
 */
class AdminService {
  // ==========================================
  // SERVICE OPERATIONS
  // ==========================================

  /**
   * Get all services with categories and subcategories
   * @returns {Promise<Array>} List of services with categories
   */
  async getAllServices() {
    try {
      const services = await prisma.service.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return services;
    } catch (error) {
      throw new Error(`Failed to fetch services: ${error.message}`);
    }
  }

  /**
   * Get single service by ID with categories and subcategories
   * @param {string} id - Service ID
   * @returns {Promise<Object>} Service object with categories
   */
  async getServiceById(id) {
    try {
      const service = await prisma.service.findUnique({
        where: { id }
      });
      return service;
    } catch (error) {
      throw new Error(`Failed to fetch service: ${error.message}`);
    }
  }

  /**
   * Create new service
   * @param {Object} serviceData - Service data
   * @returns {Promise<Object>} Created service
   */
  async createService(serviceData) {
    const { name, slug, description, icon } = serviceData;

    try {
      // Check if slug already exists
      const existingService = await prisma.service.findUnique({
        where: { slug }
      });

      if (existingService) {
        throw new Error('Service slug already exists');
      }

      const service = await prisma.service.create({
        data: {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description,
          icon
        }
      });

      return service;
    } catch (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  /**
   * Update service
   * @param {string} id - Service ID
   * @param {Object} serviceData - Updated service data
   * @returns {Promise<Object>} Updated service
   */
  async updateService(id, serviceData) {
    const { name, slug, description, icon } = serviceData;

    try {
      // Check if slug already exists (if being changed)
      if (slug) {
        const existingService = await prisma.service.findFirst({
          where: {
            slug,
            id: { not: id }
          }
        });

        if (existingService) {
          throw new Error('Service slug already exists');
        }
      }

      const service = await prisma.service.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description && { description }),
          ...(icon && { icon })
        }
      });

      return service;
    } catch (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  /**
   * Delete service
   * @param {string} id - Service ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteService(id) {
    try {
      await prisma.service.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  }

  // ==========================================
  // CATEGORY OPERATIONS
  // ==========================================

  /**
   * Get all categories for a service
   * @param {string} serviceId - Optional filter by service ID
   * @returns {Promise<Array>} List of categories with subcategories
   */
  async getAllCategories(serviceId = null) {
    try {
      const where = serviceId ? { serviceId } : {};

      const categories = await prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return categories;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Get single category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category object with subcategories
   */
  async getCategoryById(id) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          subcategories: {
            select: { id: true, name: true, slug: true, description: true }
          }
        }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
  }

  /**
   * Create new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    const { name, slug, description, serviceId } = categoryData;

    try {
      // Validate required fields
      if (!serviceId) {
        throw new Error('serviceId is required for creating a category');
      }

      // Check if slug already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug }
      });

      if (existingCategory) {
        throw new Error('Category slug already exists');
      }

      // Verify service exists
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description,
          serviceId
        },
        include: {
          subcategories: true
        }
      });

      return category;
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(id, categoryData) {
    const { name, slug, description } = categoryData;

    try {
      // Check if slug already exists (if being changed)
      if (slug) {
        const existingCategory = await prisma.category.findFirst({
          where: {
            slug,
            id: { not: id }
          }
        });

        if (existingCategory) {
          throw new Error('Category slug already exists');
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description && { description })
        },
        include: {
          subcategories: true
        }
      });

      return category;
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCategory(id) {
    try {
      // Check if category has products
      const productsCount = await prisma.product.count({
        where: { categoryId: id }
      });

      if (productsCount > 0) {
        throw new Error('Cannot delete category with associated products');
      }

      // Check if category has subcategories
      const subcategoriesCount = await prisma.subcategory.count({
        where: { categoryId: id }
      });

      if (subcategoriesCount > 0) {
        throw new Error('Cannot delete category with associated subcategories. Delete subcategories first.');
      }

      await prisma.category.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // ==========================================
  // SUBCATEGORY OPERATIONS
  // ==========================================

  /**
   * Get all subcategories
   * @returns {Promise<Array>} List of all subcategories
   */
  async getAllSubcategories() {
    try {
      const subcategories = await prisma.subcategory.findMany({
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return subcategories;
    } catch (error) {
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }
  }

  /**
   * Get all subcategories for a category
   * @param {string} categoryId - Parent category ID
   * @returns {Promise<Array>} List of subcategories
   */
  async getSubcategoriesByCategory(categoryId) {
    try {
      const subcategories = await prisma.subcategory.findMany({
        where: { categoryId },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return subcategories;
    } catch (error) {
      throw new Error(`Failed to fetch subcategories: ${error.message}`);
    }
  }

  /**
   * Get single subcategory by ID
   * @param {string} id - Subcategory ID
   * @returns {Promise<Object>} Subcategory object
   */
  async getSubcategoryById(id) {
    try {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      if (!subcategory) {
        throw new Error('Subcategory not found');
      }

      return subcategory;
    } catch (error) {
      throw new Error(`Failed to fetch subcategory: ${error.message}`);
    }
  }

  /**
   * Create new subcategory
   * @param {Object} subcategoryData - Subcategory data
   * @returns {Promise<Object>} Created subcategory
   */
  async createSubcategory(subcategoryData) {
    const { name, slug, description, categoryId } = subcategoryData;

    try {
      // Validate required fields
      if (!categoryId) {
        throw new Error('categoryId is required for creating a subcategory');
      }

      // Check if slug already exists
      const existingSubcategory = await prisma.subcategory.findUnique({
        where: { slug }
      });

      if (existingSubcategory) {
        throw new Error('Subcategory slug already exists');
      }

      // Verify parent category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        throw new Error('Parent category not found');
      }

      const subcategory = await prisma.subcategory.create({
        data: {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description,
          categoryId
        },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      return subcategory;
    } catch (error) {
      throw new Error(`Failed to create subcategory: ${error.message}`);
    }
  }

  /**
   * Update subcategory
   * @param {string} id - Subcategory ID
   * @param {Object} subcategoryData - Updated subcategory data
   * @returns {Promise<Object>} Updated subcategory
   */
  async updateSubcategory(id, subcategoryData) {
    const { name, slug, description } = subcategoryData;

    try {
      // Check if slug already exists (if being changed)
      if (slug) {
        const existingSubcategory = await prisma.subcategory.findFirst({
          where: {
            slug,
            id: { not: id }
          }
        });

        if (existingSubcategory) {
          throw new Error('Subcategory slug already exists');
        }
      }

      const subcategory = await prisma.subcategory.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description && { description })
        },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      return subcategory;
    } catch (error) {
      throw new Error(`Failed to update subcategory: ${error.message}`);
    }
  }

  /**
   * Delete subcategory
   * @param {string} id - Subcategory ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSubcategory(id) {
    try {
      // Check if subcategory has products
      const productsCount = await prisma.product.count({
        where: { subcategoryId: id }
      });

      if (productsCount > 0) {
        throw new Error('Cannot delete subcategory with associated products');
      }

      await prisma.subcategory.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Subcategory deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete subcategory: ${error.message}`);
    }
  }
}

module.exports = new AdminService();
