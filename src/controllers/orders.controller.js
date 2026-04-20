const adminOrdersService = require('../services/orders.service');
const path = require('path');
const fs = require('fs').promises;

/**
 * Admin Orders Controller
 * Handles HTTP requests for order management
 */
class AdminOrdersController {
  /**
   * Get all orders with pagination and filters
   * @route GET /api/admin/orders?page=1&limit=10&status=PROCESSING&serviceId=xxx&search=orderid|customername|email
   */
  async getAllOrders(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
      
      const filters = {
        status: req.query.status || 'ALL',
        serviceId: req.query.serviceId || 'ALL',
        method: req.query.method || 'ALL',
        search: req.query.search || ''
      };

      const result = await adminOrdersService.getAllOrders(page, limit, filters);

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
   * Get order by ID
   * @route GET /api/admin/orders/:orderId
   */
  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await adminOrdersService.getOrderById(orderId);

      res.status(200).json({
        success: true,
        data: order
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
   * Update order status
   * @route PUT /api/admin/orders/:orderId/status
   */
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const updatedOrder = await adminOrdersService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
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
   * Get order statistics
   * @route GET /api/admin/orders/stats
   */
  async getOrderStats(req, res, next) {
    try {
      const stats = await adminOrdersService.getOrderStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Download uploaded file from order customization
   * @route GET /api/admin/orders/:orderId/files/:fileName
   */
  async downloadFile(req, res, next) {
    try {
      const { orderId, fileName } = req.params;

      // Get order to verify it exists and get file path
      const order = await adminOrdersService.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Get customization details and find file
      const design = order.customizationDetails?.design || {};
      let filePath = null;

      // Check for uploaded logo
      if (design.uploadedLogo && design.uploadedLogo.fileName === fileName) {
        filePath = design.uploadedLogo.filePath;
      }
      // Check for design file
      else if (design.designFile && design.designFile.fileName === fileName) {
        filePath = design.designFile.filePath;
      }

      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'File not found in order'
        });
      }

      // Construct absolute file path
      const absolutePath = path.join(__dirname, '../../', filePath);

      // Check if file exists
      try {
        await fs.access(absolutePath);
      } catch (err) {
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }

      // Send file for download
      res.download(absolutePath, fileName, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Error downloading file'
            });
          }
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
   * Get all available order statuses
   * @route GET /api/admin/orders/statuses
   */
  async getAllOrderStatuses(req, res, next) {
    try {
      const statuses = await adminOrdersService.getAllOrderStatuses();

      res.status(200).json({
        success: true,
        data: statuses
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminOrdersController();
