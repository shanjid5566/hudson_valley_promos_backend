const prisma = require('../utils/prisma');

/**
 * Admin Orders Service Layer
 * Handles all order business logic for admin panel
 */
class AdminOrdersService {
  /**
   * Get all orders with pagination and filters
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of records to return (default: 10)
   * @param {object} filters - Filters for status, serviceId, method, search
   * @returns {Promise<Object>} List of orders with total count
   */
  async getAllOrders(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause based on filters
      const where = {};
      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status;
      }

      // Filter by service through order items
      if (filters.serviceId && filters.serviceId !== 'ALL') {
        where.items = {
          some: {
            product: {
              category: {
                serviceId: filters.serviceId
              }
            }
          }
        };
      }

      // Search by OrderId, Customer name, or Email
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim().toLowerCase();
        where.OR = [
          {
            orderNumber: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            id: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            user: {
              OR: [
                {
                  firstName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                },
                {
                  lastName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      service: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });

      const total = await prisma.order.count({ where });

      // Transform orders to match frontend format
      const transformedOrders = orders.map(order => {
        const firstItem = order.items[0];
        const customization = firstItem?.customizationDetails || {};
        
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customer: {
            name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A',
            email: order.user.email
          },
          service: firstItem?.product?.category?.service?.name || 'N/A',
          product: {
            name: firstItem?.product?.name || 'N/A',
            quantity: firstItem?.quantity || 0
          },
          method: customization?.printing?.method || 'N/A',
          status: order.status,
          paymentStatus: order.payments[0]?.status || 'PENDING',
          totalAmount: parseFloat(order.totalAmount),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      });

      return {
        data: transformedOrders,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Get order by ID with full details
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order object with full details
   */
  async getOrderById(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          shippingAddress: true,
          items: {
            include: {
              product: {
                include: {
                  category: {
                    include: {
                      service: true
                    }
                  }
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              method: true,
              createdAt: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Transform to match frontend format
      const firstItem = order.items[0];
      const customization = firstItem?.customizationDetails || {};

      // Calculate pricing breakdown
      const basePrice = parseFloat(firstItem?.unitPrice || 0);
      const customizationCost = parseFloat(customization?.pricing?.customization || 0);
      const printingCost = parseFloat(customization?.pricing?.printing || 0);
      const shippingCost = parseFloat(order.shippingCost);
      const subtotal = parseFloat(order.subTotal);
      const total = parseFloat(order.totalAmount);
      const tax = total - (subtotal + shippingCost);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payments[0]?.status || 'PENDING',
        totalAmount: total,
        placedAt: order.createdAt,
        
        product: {
          service: firstItem?.product?.category?.service?.name || 'N/A',
          category: firstItem?.product?.category?.name || 'N/A',
          productName: firstItem?.product?.name || 'N/A',
          quantity: firstItem?.quantity || 0
        },

        customer: {
          name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A',
          email: order.user.email,
          phone: order.user.phone || 'N/A'
        },

        delivery: {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          zipCode: order.shippingAddress.zipCode,
          company: order.shippingAddress.company
        },

        pricing: {
          basePrice: basePrice,
          customization: customizationCost,
          printing: printingCost,
          shipping: shippingCost,
          tax: tax,
          total: total
        },

        customizationDetails: {
          basics: customization?.basics || {},
          printing: customization?.printing || {},
          design: customization?.design || {},
          material: customization?.material || {},
          specialInstructions: customization?.specialInstructions || ''
        },

        items: order.items,
        payments: order.payments
      };
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status (PENDING, PROCESSING, COMPLETED, CANCELLED)
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          updatedAt: true
        }
      });

      return updatedOrder;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Order not found');
      }
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Get order statistics
   * @returns {Promise<Object>} Order statistics (total, pending, processing, completed)
   */
  async getOrderStats() {
    try {
      const [total, pending, processing, completed] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'COMPLETED' } })
      ]);

      return {
        total,
        pending,
        processing,
        completed
      };
    } catch (error) {
      throw new Error(`Failed to fetch order statistics: ${error.message}`);
    }
  }

  /**
   * Get all available order statuses
   * @returns {Array} List of available order statuses with labels and colors
   */
  async getAllOrderStatuses() {
    try {
      return [
        {
          value: 'PENDING',
          label: 'Pending',
        },
        {
          value: 'PROCESSING',
          label: 'Processing',
        },
        {
          value: 'COMPLETED',
          label: 'Completed',
        },
        {
          value: 'CANCELLED',
          label: 'Cancelled',
        }
      ];
    } catch (error) {
      throw new Error(`Failed to fetch order statuses: ${error.message}`);
    }
  }
}

module.exports = new AdminOrdersService();
