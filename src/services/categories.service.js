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
 * Admin Categories Service Layer
 * Handles all category-related business logic
 */
class AdminCategoriesService {
  /**
   * Get all categories
   * @param {string} serviceId - Optional filter by service ID
   * @returns {Promise<Array>} List of categories with subcategories
   */
  async getAllCategories(serviceId = null) {
    try {
      const where = serviceId ? { serviceId } : {};

      const categories = await prisma.category.findMany({
        where,
        include: {
          subcategories: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true
            }
          }
        },
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
}

module.exports = new AdminCategoriesService();
