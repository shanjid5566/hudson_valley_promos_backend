const prisma = require('../utils/prisma');

function normalizeAttributeType(type) {
  if (!type || typeof type !== 'string') return null;

  const normalized = type.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases = {
    SELECT: 'DROPDOWN',
    RADIO_BUTTON: 'RADIO',
    COLOR_SWATCH: 'COLOR_SWATCHES'
  };

  return aliases[normalized] || normalized;
}

const ALLOWED_ATTRIBUTE_TYPES = [
  'CHECKBOX',
  'RADIO',
  'PILLS',
  'RICH_PILLS',
  'COLOR_SWATCHES',
  'DROPDOWN',
  'FILE_UPLOAD',
  'TEXT_INPUT',
  'TEXT_AREA'
];

class AdminAttributesService {
  async getAllAttributes(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      } else if (filters.serviceId) {
        const categories = await prisma.category.findMany({
          where: { serviceId: filters.serviceId },
          select: { id: true }
        });
        const categoryIds = categories.map(cat => cat.id);
        if (categoryIds.length > 0) {
          where.categoryId = { in: categoryIds };
        } else {
          return {
            data: [],
            total: 0,
            page,
            limit,
            hasMore: false
          };
        }
      }

      const attributes = await prisma.productAttribute.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, service: { select: { id: true, name: true } } }
          },
          options: true
        },
        orderBy: [
          { stepOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      });

      const total = await prisma.productAttribute.count({ where });

      return {
        data: attributes,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch attributes: ${error.message}`);
    }
  }

  async getAttributesByCategory(categoryId) {
    try {
      const attributes = await prisma.productAttribute.findMany({
        where: { categoryId },
        include: { options: true },
        orderBy: { stepOrder: 'asc' }
      });
      return attributes;
    } catch (error) {
      throw new Error(`Failed to fetch attributes for category: ${error.message}`);
    }
  }

  async createAttribute(data) {
    const { name, type, categoryId, options = [], stepOrder = 0, isRequired = false } = data;
    const normalizedType = normalizeAttributeType(type);
    
    try {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new Error('Category not found');

      const existingAttribute = await prisma.productAttribute.findFirst({
        where: {
          categoryId: categoryId,
          name: {
            equals: name.trim(),
            mode: 'insensitive'
          }
        }
      });

      if (existingAttribute) {
        throw new Error(`An attribute with the name "${name}" already exists for this category.`);
      }

      if (!normalizedType || !ALLOWED_ATTRIBUTE_TYPES.includes(normalizedType)) {
        throw new Error(
          `Invalid attribute type. Allowed types: ${ALLOWED_ATTRIBUTE_TYPES.join(', ')}`
        );
      }

      const attributeOptions = options.length > 0 ? {
        create: options.map(opt => ({
          value: opt.value,
          subtext: opt.subtext || null,
          colorHex: opt.colorHex || null
        }))
      } : undefined;

      const attribute = await prisma.productAttribute.create({
        data: {
          name: name.trim(),
          type: normalizedType,
          categoryId,
          stepOrder: parseInt(stepOrder, 10) || 0,
          isRequired: Boolean(isRequired),
          options: attributeOptions
        },
        include: { options: true }
      });

      return attribute;
    } catch (error) {
      throw new Error(`Failed to create attribute: ${error.message}`);
    }
  }

  async deleteAttribute(id) {
    try {
      await prisma.productAttribute.delete({ where: { id } });
      return { success: true, message: 'Attribute deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete attribute: ${error.message}`);
    }
  }
}

module.exports = new AdminAttributesService();