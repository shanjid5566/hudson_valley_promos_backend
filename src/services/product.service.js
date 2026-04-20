const prisma = require('../utils/prisma');

class ProductService {
  /**
   * Get products for public listing with advanced filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - { serviceId, categoryId, subcategoryId, minPrice, maxPrice, search }
   */
  async getPublicProducts(page = 1, limit = 12, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      // Filter by service
      if (filters.serviceId && filters.serviceId !== 'ALL') {
        where.category = {
          serviceId: filters.serviceId
        };
      }

      // Filter by category
      if (filters.categoryId && filters.categoryId !== 'ALL') {
        where.categoryId = filters.categoryId;
      }

      // Filter by subcategory
      if (filters.subcategoryId && filters.subcategoryId !== 'ALL') {
        where.subcategoryId = filters.subcategoryId;
      }

      // Filter by price range
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.basePrice = {};
        if (filters.minPrice !== undefined) {
          where.basePrice.gte = parseFloat(filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
          where.basePrice.lte = parseFloat(filters.maxPrice);
        }
      }

      // Search by product name or description
      if (filters.search && filters.search.trim()) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              service: { select: { id: true, name: true } }
            }
          },
          subcategory: {
            select: { id: true, name: true }
          },
          pricingTiers: {
            select: { minQuantity: true, maxQuantity: true, unitPrice: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.product.count({ where });

      // Format response
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        images: product.images || [],
        category: product.category,
        subcategory: product.subcategory,
        isFeatured: product.isFeatured,
        pricingTiers: product.pricingTiers
      }));

      return {
        data: formattedProducts,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Get all products with search and filters
   */
  async getAllProducts(page = 1, limit = 10, search = '', serviceId = null) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      // Search by product name or description
      if (search && search.trim()) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Filter by service (through category)
      if (serviceId && serviceId !== 'ALL') {
        where.category = {
          serviceId
        };
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              service: { select: { id: true, name: true } }
            }
          },
          subcategory: {
            select: { id: true, name: true }
          },
          pricingTiers: {
            select: { minQuantity: true, maxQuantity: true, unitPrice: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.product.count({ where });

      // Format variants for display (e.g., show sizes as "S, M, L")
      const formattedProducts = products.map(product => ({
        ...product,
        variantsSummary: product.variants
          ? Object.entries(product.variants)
              .map(([key, options]) => {
                if (Array.isArray(options) && options.length > 0) {
                  return options
                    .slice(0, 3)
                    .map(opt => opt.value)
                    .join(', ') + (options.length > 3 ? `, +${options.length - 3}` : '');
                }
                return null;
              })
              .filter(Boolean)
          : []
      }));

      return {
        data: formattedProducts,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Get a single product by ID with full details
   */
  async getProductById(id) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              service: { select: { id: true, name: true } }
            }
          },
          subcategory: {
            select: { id: true, name: true }
          },
          pricingTiers: {
            orderBy: { minQuantity: 'asc' }
          }
        }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data) {
    const {
      name,
      description,
      basePrice,
      categoryId,
      subcategoryId,
      attributes,
      pricingTiers,
      images,
      isFeatured
    } = data;

    try {
      // Validate required fields
      if (!name || !categoryId || !basePrice) {
        throw new Error('Name, categoryId, and basePrice are required');
      }

      // Validate category exists
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new Error('Category not found');
      }

      // Validate subcategory if provided
      if (subcategoryId) {
        const subcategory = await prisma.subcategory.findUnique({
          where: { id: subcategoryId }
        });
        if (!subcategory) {
          throw new Error('Subcategory not found');
        }
      }

      // Generate unique slug from name
      const baseSlug = name
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      // Append unique identifier to ensure slug uniqueness
      const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      // Create product with nested pricing tiers
      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          slug,
          description: description || null,
          basePrice: parseFloat(basePrice),
          category: {
            connect: { id: categoryId }
          },
          subcategory: subcategoryId ? {
            connect: { id: subcategoryId }
          } : undefined,
          attributes: attributes || null,
          images: images || [],
          isFeatured: isFeatured || false,
          pricingTiers: pricingTiers
            ? {
                create: pricingTiers.map(tier => ({
                  minQuantity: tier.minQuantity,
                  maxQuantity: tier.maxQuantity || null,
                  unitPrice: parseFloat(tier.unitPrice)
                }))
              }
            : undefined
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              service: { select: { id: true, name: true } }
            }
          },
          subcategory: {
            select: { id: true, name: true }
          },
          pricingTiers: true
        }
      });

      return product;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id, data) {
    const {
      name,
      description,
      basePrice,
      categoryId,
      subcategoryId,
      attributes,
      pricingTiers,
      images,
      isFeatured
    } = data;

    try {
      const existingProduct = await prisma.product.findUnique({ where: { id } });
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Validate category if provided
      if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
          throw new Error('Category not found');
        }
      }

      // Validate subcategory if provided
      if (subcategoryId) {
        const subcategory = await prisma.subcategory.findUnique({
          where: { id: subcategoryId }
        });
        if (!subcategory) {
          throw new Error('Subcategory not found');
        }
      }

      const updateData = {};

      if (name) {
        updateData.name = name.trim();
        // Generate unique slug when name is updated
        const baseSlug = name
          .trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        updateData.slug = `${baseSlug}-${uniqueSuffix}`;
      }

      if (description !== undefined) updateData.description = description;
      if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
      if (categoryId !== undefined) {
        updateData.category = {
          connect: { id: categoryId }
        };
      }
      if (subcategoryId !== undefined) {
        updateData.subcategory = subcategoryId ? {
          connect: { id: subcategoryId }
        } : {
          disconnect: true
        };
      }
      if (attributes !== undefined) updateData.attributes = attributes;
      if (images !== undefined) updateData.images = images;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

      // Delete old pricing tiers and create new ones if provided
      if (pricingTiers) {
        await prisma.pricingTier.deleteMany({ where: { productId: id } });
        updateData.pricingTiers = {
          create: pricingTiers.map(tier => ({
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity || null,
            unitPrice: parseFloat(tier.unitPrice)
          }))
        };
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              service: { select: { id: true, name: true } }
            }
          },
          subcategory: {
            select: { id: true, name: true }
          },
          pricingTiers: true
        }
      });

      return updatedProduct;
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id) {
    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if product has any order items
      const orderItemsCount = await prisma.orderItem.count({
        where: { productId: id }
      });

      if (orderItemsCount > 0) {
        throw new Error(
          `Cannot delete product: ${orderItemsCount} order(s) are using this product. Delete or modify those orders first.`
        );
      }

      await prisma.product.delete({ where: { id } });

      return {
        success: true,
        message: 'Product deleted successfully',
        productId: id
      };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}

module.exports = new ProductService();
