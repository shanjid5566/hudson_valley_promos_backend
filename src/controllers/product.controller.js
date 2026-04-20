const productService = require('../services/product.service');

class ProductController {
  /**
   * Get all products with search and filters
   * @route GET /api/products?page=1&limit=10&search=&serviceId=
   */
  async getAllProducts(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
      const search = req.query.search || '';
      const serviceId = req.query.serviceId || null;

      const result = await productService.getAllProducts(page, limit, search, serviceId);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get single product by ID
   * @route GET /api/products/:id
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create a new product with image uploads
   * @route POST /api/admin/products
   */
  async createProduct(req, res) {
    try {
      let {
        name,
        description,
        basePrice,
        categoryId,
        subcategoryId,
        attributes,
        pricingTiers,
        isFeatured
      } = req.body;

      // Parse JSON strings from form-data
      if (attributes && typeof attributes === 'string') {
        try {
          attributes = JSON.parse(attributes);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid attributes JSON format'
          });
        }
      }

      if (pricingTiers && typeof pricingTiers === 'string') {
        try {
          pricingTiers = JSON.parse(pricingTiers);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid pricingTiers JSON format'
          });
        }
      }

      // Parse basePrice as number
      if (basePrice && typeof basePrice === 'string') {
        basePrice = parseFloat(basePrice);
      }

      // Parse isFeatured as boolean if it's a string
      if (isFeatured && typeof isFeatured === 'string') {
        isFeatured = isFeatured === 'true';
      }

      // Basic validation
      if (!name || !categoryId || !basePrice) {
        return res.status(400).json({
          success: false,
          error: 'Name, categoryId, and basePrice are required'
        });
      }

      // Get uploaded image URLs
      const images = req.uploadedImages || [];
      if (images.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one product image is required'
        });
      }

      const product = await productService.createProduct({
        name,
        description,
        basePrice,
        categoryId,
        subcategoryId,
        attributes,
        pricingTiers,
        images,
        isFeatured
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update an existing product
   * @route PUT /api/admin/products/:id
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      let {
        name,
        description,
        basePrice,
        categoryId,
        subcategoryId,
        attributes,
        pricingTiers,
        isFeatured
      } = req.body;

      // Parse JSON strings from form-data only if provided
      if (attributes && typeof attributes === 'string') {
        try {
          attributes = JSON.parse(attributes);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid attributes JSON format'
          });
        }
      }

      if (pricingTiers && typeof pricingTiers === 'string') {
        try {
          pricingTiers = JSON.parse(pricingTiers);
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid pricingTiers JSON format'
          });
        }
      }

      // Parse basePrice as number
      if (basePrice && typeof basePrice === 'string') {
        basePrice = parseFloat(basePrice);
      }

      // Parse isFeatured as boolean if it's a string
      if (isFeatured && typeof isFeatured === 'string') {
        isFeatured = isFeatured === 'true';
      }

      // Get uploaded image URLs (optional for update)
      const images = req.uploadedImages || undefined;

      // Build update object with only provided fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (basePrice !== undefined) updateData.basePrice = basePrice;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (subcategoryId !== undefined) updateData.subcategoryId = subcategoryId;
      if (attributes !== undefined) updateData.attributes = attributes;
      if (pricingTiers !== undefined) updateData.pricingTiers = pricingTiers;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (images !== undefined) updateData.images = images;

      const product = await productService.updateProduct(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a product
   * @route DELETE /api/products/:id
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();
