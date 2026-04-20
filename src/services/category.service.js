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
 * Categories Service Layer (Public)
 * Handles all public category-related business logic
 */
class CategoryService {
  /**
   * Get all categories with subcategories
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
   * Get single category by ID with subcategories
   * @param {string} id - Category ID
   * @returns {Promise<Object>} Category object with subcategories
   */
  async getCategoryById(id) {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          subcategories: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true
            }
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
}

module.exports = new CategoryService();
