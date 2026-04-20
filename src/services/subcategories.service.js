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
 * Admin Subcategories Service Layer
 * Handles all subcategory-related business logic
 */
class AdminSubcategoriesService {
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

module.exports = new AdminSubcategoriesService();
