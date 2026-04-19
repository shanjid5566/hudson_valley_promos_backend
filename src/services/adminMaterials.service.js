const prisma = require('../utils/prisma');

/**
 * Admin Materials Service Layer
 * Handles all material business logic
 */
class AdminMaterialsService {
  /**
   * Get all materials with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} List of materials with total count
   */
  async getAllMaterials(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const materials = await prisma.material.findMany({
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.material.count();

      return {
        data: materials,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }
  }

  /**
   * Get materials by category ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} List of materials in category
   */
  async getMaterialsByCategoryId(categoryId) {
    try {
      const materials = await prisma.material.findMany({
        where: { categoryId },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return materials;
    } catch (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }
  }

  /**
   * Get single material by ID
   * @param {string} id - Material ID
   * @returns {Promise<Object>} Material object
   */
  async getMaterialById(id) {
    try {
      const material = await prisma.material.findUnique({
        where: { id },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      if (!material) {
        throw new Error('Material not found');
      }

      return material;
    } catch (error) {
      throw new Error(`Failed to fetch material: ${error.message}`);
    }
  }

  /**
   * Create new material
   * @param {Object} materialData - Material data
   * @returns {Promise<Object>} Created material
   */
  async createMaterial(materialData) {
    const { name, categoryId } = materialData;

    try {
      // Check if material name already exists
      const existingMaterial = await prisma.material.findUnique({
        where: { name }
      });

      if (existingMaterial) {
        throw new Error('Material with this name already exists');
      }

      // Validate categoryId
      if (!categoryId || categoryId.trim() === '') {
        throw new Error('categoryId is required');
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      const material = await prisma.material.create({
        data: {
          name: name.trim(),
          categoryId
        },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      return material;
    } catch (error) {
      throw new Error(`Failed to create material: ${error.message}`);
    }
  }

  /**
   * Update material
   * @param {string} id - Material ID
   * @param {Object} materialData - Updated material data
   * @returns {Promise<Object>} Updated material
   */
  async updateMaterial(id, materialData) {
    const { name, categoryId } = materialData;

    try {
      // Check if material exists
      const existingMaterial = await prisma.material.findUnique({
        where: { id }
      });

      if (!existingMaterial) {
        throw new Error('Material not found');
      }

      // Check if name already exists (if being changed)
      if (name) {
        const duplicateMaterial = await prisma.material.findFirst({
          where: {
            name: name.trim(),
            id: { not: id }
          }
        });

        if (duplicateMaterial) {
          throw new Error('Material with this name already exists');
        }
      }

      // Verify category exists if categoryId is being updated
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });

        if (!category) {
          throw new Error('Category not found');
        }
      }

      const material = await prisma.material.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(categoryId && { categoryId })
        },
        include: {
          category: {
            select: { id: true, name: true, serviceId: true }
          }
        }
      });

      return material;
    } catch (error) {
      throw new Error(`Failed to update material: ${error.message}`);
    }
  }

  /**
   * Delete material
   * @param {string} id - Material ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMaterial(id) {
    try {
      await prisma.material.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Material deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete material: ${error.message}`);
    }
  }
}

module.exports = new AdminMaterialsService();
