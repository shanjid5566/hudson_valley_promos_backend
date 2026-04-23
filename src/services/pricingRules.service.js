const prisma = require('../utils/prisma');

/**
 * Admin Pricing Rules Service Layer
 * Handles all pricing rule business logic
 */
class AdminPricingRulesService {
  /**
   * Get all pricing rules with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} List of pricing rules with total count
   */
  async getAllPricingRules(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const rules = await prisma.pricingRule.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.pricingRule.count();

      return {
        data: rules,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch pricing rules: ${error.message}`);
    }
  }

  /**
   * Get single pricing rule by ID
   * @param {string} id - Pricing rule ID
   * @returns {Promise<Object>} Pricing rule object
   */
  async getPricingRuleById(id) {
    try {
      const rule = await prisma.pricingRule.findUnique({
        where: { id }
      });

      if (!rule) {
        throw new Error('Pricing rule not found');
      }

      return rule;
    } catch (error) {
      throw new Error(`Failed to fetch pricing rule: ${error.message}`);
    }
  }

  /**
   * Create new pricing rule
   * Auto-generates priority based on existing rules (ignored if provided)
   * @param {Object} ruleData - Pricing rule data
   * @returns {Promise<Object>} Created pricing rule
   */
  async createPricingRule(ruleData) {
    const { 
      name, 
      type, 
      value, 
      description, 
      application, 
      scope, 
      isActive, 
      conditions
    } = ruleData;

    try {
      // Check if rule name already exists
      const existingRule = await prisma.pricingRule.findUnique({
        where: { name }
      });

      if (existingRule) {
        throw new Error('Pricing rule with this name already exists');
      }

      // Validate type
      if (!['FIXED', 'PERCENTAGE'].includes(type)) {
        throw new Error('Type must be either FIXED or PERCENTAGE');
      }

      // Validate application if provided
      const validApplications = ['PER_ORDER', 'PER_ITEM', 'ON_SUBTOTAL', 'CONDITIONAL'];
      if (application && !validApplications.includes(application)) {
        throw new Error(`Application must be one of: ${validApplications.join(', ')}`);
      }

      // Validate scope if provided
      const validScopes = ['ORDER_TOTAL', 'SUBTOTAL', 'TOTAL_QUANTITY', 'PER_PRODUCT'];
      if (scope && !validScopes.includes(scope)) {
        throw new Error(`Scope must be one of: ${validScopes.join(', ')}`);
      }

      // Validate value
      if (isNaN(value) || value < 0) {
        throw new Error('Value must be a positive number');
      }

      // Auto-generate priority: find highest priority and add 10
      const lastRule = await prisma.pricingRule.findFirst({
        orderBy: { priority: 'desc' },
        select: { priority: true }
      });
      const autoPriority = lastRule ? lastRule.priority + 10 : 0;

      const rule = await prisma.pricingRule.create({
        data: {
          name: name.trim(),
          type,
          value: parseFloat(value),
          description: description || null,
          application: application || 'PER_ORDER',
          scope: scope || 'ORDER_TOTAL',
          isActive: isActive !== undefined ? isActive : true,
          conditions: conditions || null,
          priority: autoPriority  // Auto-generated, user input ignored
        }
      });

      return rule;
    } catch (error) {
      throw new Error(`Failed to create pricing rule: ${error.message}`);
    }
  }

  /**
   * Update pricing rule
   * @param {string} id - Pricing rule ID
   * @param {Object} ruleData - Updated pricing rule data
   * @returns {Promise<Object>} Updated pricing rule
   */
  async updatePricingRule(id, ruleData) {
    const { 
      name, 
      type, 
      value, 
      description, 
      application, 
      scope, 
      isActive, 
      conditions, 
      priority 
    } = ruleData;

    try {
      // Check if name already exists (if being changed)
      if (name) {
        const existingRule = await prisma.pricingRule.findFirst({
          where: {
            name: name.trim(),
            id: { not: id }
          }
        });

        if (existingRule) {
          throw new Error('Pricing rule with this name already exists');
        }
      }

      // Validate type if provided
      if (type && !['FIXED', 'PERCENTAGE'].includes(type)) {
        throw new Error('Type must be either FIXED or PERCENTAGE');
      }

      // Validate application if provided
      const validApplications = ['PER_ORDER', 'PER_ITEM', 'ON_SUBTOTAL', 'CONDITIONAL'];
      if (application && !validApplications.includes(application)) {
        throw new Error(`Application must be one of: ${validApplications.join(', ')}`);
      }

      // Validate scope if provided
      const validScopes = ['ORDER_TOTAL', 'SUBTOTAL', 'TOTAL_QUANTITY', 'PER_PRODUCT'];
      if (scope && !validScopes.includes(scope)) {
        throw new Error(`Scope must be one of: ${validScopes.join(', ')}`);
      }

      // Validate value if provided
      if (value !== undefined && (isNaN(value) || value < 0)) {
        throw new Error('Value must be a positive number');
      }

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (type) updateData.type = type;
      if (value !== undefined) updateData.value = parseFloat(value);
      if (description !== undefined) updateData.description = description;
      if (application) updateData.application = application;
      if (scope) updateData.scope = scope;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (conditions !== undefined) updateData.conditions = conditions;
      if (priority !== undefined) updateData.priority = priority;

      const rule = await prisma.pricingRule.update({
        where: { id },
        data: updateData
      });

      return rule;
    } catch (error) {
      throw new Error(`Failed to update pricing rule: ${error.message}`);
    }
  }

  /**
   * Delete pricing rule
   * @param {string} id - Pricing rule ID
   * @returns {Promise<Object>} Deletion result
   */
  async deletePricingRule(id) {
    try {
      await prisma.pricingRule.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Pricing rule deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete pricing rule: ${error.message}`);
    }
  }
}

module.exports = new AdminPricingRulesService();
