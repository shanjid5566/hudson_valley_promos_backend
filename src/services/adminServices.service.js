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
 * Admin Services Service Layer
 * Handles all service-related business logic
 */
class AdminServicesService {
  /**
   * Get all services
   * @returns {Promise<Array>} List of services
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
   * Get single service by ID
   * @param {string} id - Service ID
   * @returns {Promise<Object>} Service object
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
}

module.exports = new AdminServicesService();
