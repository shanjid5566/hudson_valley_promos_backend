const prisma = require('../utils/prisma');

/**
 * Admin Printing Methods Service Layer
 * Handles all printing method business logic
 */
class AdminPrintingMethodsService {
  /**
   * Get all printing methods with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} List of printing methods with total count
   */
  async getAllPrintingMethods(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const methods = await prisma.printingMethod.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.printingMethod.count();

      return {
        data: methods,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch printing methods: ${error.message}`);
    }
  }

  /**
   * Get single printing method by ID
   * @param {string} id - Printing method ID
   * @returns {Promise<Object>} Printing method object
   */
  async getPrintingMethodById(id) {
    try {
      const method = await prisma.printingMethod.findUnique({
        where: { id }
      });

      if (!method) {
        throw new Error('Printing method not found');
      }

      return method;
    } catch (error) {
      throw new Error(`Failed to fetch printing method: ${error.message}`);
    }
  }

  /**
   * Create new printing method
   * @param {Object} methodData - Printing method data
   * @returns {Promise<Object>} Created printing method
   */
  async createPrintingMethod(methodData) {
    const { name, description } = methodData;

    try {
      // Check if printing method name already exists
      const existingMethod = await prisma.printingMethod.findUnique({
        where: { name }
      });

      if (existingMethod) {
        throw new Error('Printing method with this name already exists');
      }

      // Validate name
      if (!name || name.trim() === '') {
        throw new Error('Printing method name is required');
      }

      const method = await prisma.printingMethod.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null
        }
      });

      return method;
    } catch (error) {
      throw new Error(`Failed to create printing method: ${error.message}`);
    }
  }

  /**
   * Update printing method
   * @param {string} id - Printing method ID
   * @param {Object} methodData - Updated printing method data
   * @returns {Promise<Object>} Updated printing method
   */
  async updatePrintingMethod(id, methodData) {
    const { name, description } = methodData;

    try {
      // Check if printing method exists
      const existingMethod = await prisma.printingMethod.findUnique({
        where: { id }
      });

      if (!existingMethod) {
        throw new Error('Printing method not found');
      }

      // Check if name already exists (if being changed)
      if (name) {
        const duplicateMethod = await prisma.printingMethod.findFirst({
          where: {
            name: name.trim(),
            id: { not: id }
          }
        });

        if (duplicateMethod) {
          throw new Error('Printing method with this name already exists');
        }
      }

      const method = await prisma.printingMethod.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description: description ? description.trim() : null })
        }
      });

      return method;
    } catch (error) {
      throw new Error(`Failed to update printing method: ${error.message}`);
    }
  }

  /**
   * Delete printing method
   * @param {string} id - Printing method ID
   * @returns {Promise<Object>} Deleted printing method
   */
  async deletePrintingMethod(id) {
    try {
      // Check if printing method exists
      const existingMethod = await prisma.printingMethod.findUnique({
        where: { id }
      });

      if (!existingMethod) {
        throw new Error('Printing method not found');
      }

      const method = await prisma.printingMethod.delete({
        where: { id }
      });

      return method;
    } catch (error) {
      throw new Error(`Failed to delete printing method: ${error.message}`);
    }
  }
}

module.exports = new AdminPrintingMethodsService();
