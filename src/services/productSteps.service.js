const prisma = require('../utils/prisma');

const ALLOWED_INPUT_TYPES = [
  'FILE_UPLOAD',
  'RADIO',
  'CHECKBOX',
  'DROPDOWN',
  'PILLS',
  'COLOR_SWATCHES',
  'TEXT_INPUT',
  'TEXT_AREA'
];

class ProductStepsService {
  /**
   * Get all product step configurations with pagination and filters
   */
  async getAllConfigurations(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      } else if (filters.serviceId) {
        where.serviceId = filters.serviceId;
      }

      const configurations = await prisma.productStepConfiguration.findMany({
        where,
        include: {
          service: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          steps: {
            include: { options: true },
            orderBy: { stepOrder: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.productStepConfiguration.count({ where });

      return {
        data: configurations,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch configurations: ${error.message}`);
    }
  }

  /**
   * Get single configuration by ID
   */
  async getConfigurationById(configurationId) {
    try {
      const configuration = await prisma.productStepConfiguration.findUnique({
        where: { id: configurationId },
        include: {
          service: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          steps: {
            include: { options: true },
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!configuration) {
        throw new Error('Configuration not found');
      }

      return configuration;
    } catch (error) {
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }
  }

  /**
   * Get configuration by service + category
   */
  async getConfigurationByServiceAndCategory(serviceId, categoryId) {
    try {
      const configuration = await prisma.productStepConfiguration.findUnique({
        where: {
          serviceId_categoryId: { serviceId, categoryId }
        },
        include: {
          service: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          steps: {
            include: { options: true },
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      if (!configuration) {
        throw new Error('Configuration not found for this service and category');
      }

      return configuration;
    } catch (error) {
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }
  }

  /**
   * Create new step configuration
   */
  async createConfiguration(data) {
    const { serviceId, categoryId, steps = [] } = data;

    try {
      // Validate service and category exist
      const [service, category] = await Promise.all([
        prisma.service.findUnique({ where: { id: serviceId } }),
        prisma.category.findUnique({ where: { id: categoryId } })
      ]);

      if (!service) throw new Error('Service not found');
      if (!category) throw new Error('Category not found');
      if (category.serviceId !== serviceId) {
        throw new Error('Category does not belong to the specified service');
      }

      // Check if configuration already exists
      const existing = await prisma.productStepConfiguration.findUnique({
        where: { serviceId_categoryId: { serviceId, categoryId } }
      });

      if (existing) {
        throw new Error('Configuration already exists for this service and category');
      }

      // Validate steps
      steps.forEach((step, index) => {
        if (!step.stepTitle || !step.inputType) {
          throw new Error(`Step ${index + 1}: stepTitle and inputType are required`);
        }
        if (!ALLOWED_INPUT_TYPES.includes(step.inputType)) {
          throw new Error(
            `Step ${index + 1}: Invalid input type. Allowed types: ${ALLOWED_INPUT_TYPES.join(', ')}`
          );
        }

        const typesRequiringOptions = ['RADIO', 'CHECKBOX', 'DROPDOWN', 'PILLS', 'COLOR_SWATCHES'];
        if (typesRequiringOptions.includes(step.inputType)) {
          if (!Array.isArray(step.options) || step.options.length === 0) {
            throw new Error(`Step ${index + 1} (${step.inputType}): At least one option is required`);
          }
        }
      });

      // Create configuration with steps
      const configuration = await prisma.productStepConfiguration.create({
        data: {
          serviceId,
          categoryId,
          steps: {
            create: steps.map((step, index) => ({
              stepTitle: step.stepTitle,
              inputType: step.inputType,
              isRequired: step.isRequired !== undefined ? step.isRequired : true,
              stepOrder: step.stepOrder !== undefined ? step.stepOrder : index + 1,
              options: step.options && step.options.length > 0
                ? {
                    create: step.options.map((opt, optIndex) => ({
                      optionValue: opt.optionValue,
                      subtext: opt.subtext || null,
                      colorHex: opt.colorHex || null,
                      optionOrder: opt.optionOrder !== undefined ? opt.optionOrder : optIndex + 1
                    }))
                  }
                : undefined
            }))
          }
        },
        include: {
          service: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          steps: {
            include: { options: true },
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      return configuration;
    } catch (error) {
      throw new Error(`Failed to create configuration: ${error.message}`);
    }
  }

  /**
   * Update configuration (update existing steps or add new ones)
   */
  async updateConfiguration(configurationId, data) {
    const { steps = [] } = data;

    try {
      const configuration = await prisma.productStepConfiguration.findUnique({
        where: { id: configurationId }
      });

      if (!configuration) {
        throw new Error('Configuration not found');
      }

      // Validate steps
      steps.forEach((step, index) => {
        if (!step.stepTitle || !step.inputType) {
          throw new Error(`Step ${index + 1}: stepTitle and inputType are required`);
        }
        if (!ALLOWED_INPUT_TYPES.includes(step.inputType)) {
          throw new Error(
            `Step ${index + 1}: Invalid input type. Allowed types: ${ALLOWED_INPUT_TYPES.join(', ')}`
          );
        }

        const typesRequiringOptions = ['RADIO', 'CHECKBOX', 'DROPDOWN', 'PILLS', 'COLOR_SWATCHES'];
        if (typesRequiringOptions.includes(step.inputType)) {
          if (!Array.isArray(step.options) || step.options.length === 0) {
            throw new Error(`Step ${index + 1} (${step.inputType}): At least one option is required`);
          }
        }
      });

      // Delete all existing steps for this configuration
      await prisma.productStep.deleteMany({
        where: { configurationId }
      });

      // Create new steps
      const updatedConfiguration = await prisma.productStepConfiguration.update({
        where: { id: configurationId },
        data: {
          steps: {
            create: steps.map((step, index) => ({
              stepTitle: step.stepTitle,
              inputType: step.inputType,
              isRequired: step.isRequired !== undefined ? step.isRequired : true,
              stepOrder: step.stepOrder !== undefined ? step.stepOrder : index + 1,
              options: step.options && step.options.length > 0
                ? {
                    create: step.options.map((opt, optIndex) => ({
                      optionValue: opt.optionValue,
                      subtext: opt.subtext || null,
                      colorHex: opt.colorHex || null,
                      optionOrder: opt.optionOrder !== undefined ? opt.optionOrder : optIndex + 1
                    }))
                  }
                : undefined
            }))
          }
        },
        include: {
          service: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          steps: {
            include: { options: true },
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      return updatedConfiguration;
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Delete configuration and all related steps/options
   */
  async deleteConfiguration(configurationId) {
    try {
      const configuration = await prisma.productStepConfiguration.findUnique({
        where: { id: configurationId }
      });

      if (!configuration) {
        throw new Error('Configuration not found');
      }

      await prisma.productStepConfiguration.delete({
        where: { id: configurationId }
      });

      return { success: true, message: 'Configuration deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete configuration: ${error.message}`);
    }
  }

  /**
   * Reorder steps within a configuration
   */
  async reorderSteps(configurationId, stepsOrder) {
    try {
      const configuration = await prisma.productStepConfiguration.findUnique({
        where: { id: configurationId }
      });

      if (!configuration) {
        throw new Error('Configuration not found');
      }

      // Update step orders
      await Promise.all(
        stepsOrder.map(({ stepId, stepOrder }) =>
          prisma.productStep.update({
            where: { id: stepId },
            data: { stepOrder }
          })
        )
      );

      // Fetch and return updated configuration
      return this.getConfigurationById(configurationId);
    } catch (error) {
      throw new Error(`Failed to reorder steps: ${error.message}`);
    }
  }
}

module.exports = new ProductStepsService();
