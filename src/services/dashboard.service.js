const prisma = require('../utils/prisma');

/**
 * Admin Dashboard Service Layer
 * Handles all dashboard statistics and analytics
 */
class AdminDashboardService {
  /**
   * Get comprehensive dashboard overview
   * Includes revenue, order counts, growth percentages, and trends
   * @returns {Promise<Object>} Dashboard overview data
   */
  async getDashboardOverview() {
    try {
      // Get current period (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Current period statistics
      const [currentOrders, previousOrders, currentRevenue, previousRevenue] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: thirtyDaysAgo } }
        }),
        prisma.order.count({
          where: {
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
          }
        }),
        prisma.order.aggregate({
          where: { createdAt: { gte: thirtyDaysAgo } },
          _sum: { totalAmount: true }
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
          },
          _sum: { totalAmount: true }
        })
      ]);

      // Order status counts
      const [pendingCount, processingCount, completedCount, cancelledCount, totalCount] = await Promise.all([
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'COMPLETED' } }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
        prisma.order.count()
      ]);

      // Calculate growth percentages
      const currentRev = parseFloat(currentRevenue._sum.totalAmount || 0);
      const previousRev = parseFloat(previousRevenue._sum.totalAmount || 0);
      const revenueGrowth = previousRev > 0 ? ((currentRev - previousRev) / previousRev * 100) : 0;
      const ordersGrowth = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders * 100) : 0;
      const pendingGrowth = await this.calculateGrowthPercentage('PENDING', thirtyDaysAgo, sixtyDaysAgo);
      const completedGrowth = await this.calculateGrowthPercentage('COMPLETED', thirtyDaysAgo, sixtyDaysAgo);
      const cancelledGrowth = await this.calculateGrowthPercentage('CANCELLED', thirtyDaysAgo, sixtyDaysAgo);

      // Get monthly sales data (last 12 months)
      const monthlySales = await this.getMonthlySalesData();

      // Get top selling categories
      const topCategories = await this.getTopSellingCategories();

      return {
        totalRevenue: {
          amount: currentRev,
          ...(revenueGrowth !== 0 && { growth: parseFloat(revenueGrowth.toFixed(1)) })
        },
        totalOrders: {
          count: totalCount,
          ...(ordersGrowth !== 0 && { growth: parseFloat(ordersGrowth.toFixed(1)) })
        },
        pendingOrders: {
          count: pendingCount,
          ...(pendingGrowth !== 0 && { growth: parseFloat(pendingGrowth.toFixed(1)) })
        },
        completedOrders: {
          count: completedCount,
          ...(completedGrowth !== 0 && { growth: parseFloat(completedGrowth.toFixed(1)) })
        },
        cancelledOrders: {
          count: cancelledCount,
          ...(cancelledGrowth !== 0 && { growth: parseFloat(cancelledGrowth.toFixed(1)) })
        },
        salesOverview: monthlySales,
        topSellingCategories: topCategories
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard overview: ${error.message}`);
    }
  }

  /**
   * Calculate growth percentage for a specific status
   * @private
   */
  async calculateGrowthPercentage(status, startDate, previousStart) {
    const currentCount = await prisma.order.count({
      where: {
        status: status,
        createdAt: { gte: startDate }
      }
    });

    const previousCount = await prisma.order.count({
      where: {
        status: status,
        createdAt: { gte: previousStart, lt: startDate }
      }
    });

    if (previousCount === 0) return 0;
    return ((currentCount - previousCount) / previousCount) * 100;
  }

  /**
   * Get monthly sales data for the last 12 months
   * @private
   */
  async getMonthlySalesData() {
    try {
      const monthsData = [];
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();

        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);

        const revenue = await prisma.order.aggregate({
          where: {
            createdAt: { gte: startOfMonth, lte: endOfMonth }
          },
          _sum: { totalAmount: true }
        });

        monthsData.push({
          month: monthLabels[month],
          revenue: parseFloat(revenue._sum.totalAmount || 0)
        });
      }

      return monthsData;
    } catch (error) {
      console.error('Error fetching monthly sales:', error);
      return [];
    }
  }

  /**
   * Get top selling categories
   * @private
   */
  async getTopSellingCategories() {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  orderItems: {
                    some: {}
                  }
                }
              }
            }
          }
        }
      });

      // Get sales count per category
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const orderCount = await prisma.orderItem.count({
            where: {
              product: {
                categoryId: category.id
              }
            }
          });

          return {
            id: category.id,
            name: category.name,
            orderCount: orderCount
          };
        })
      );

      // Sort by orderCount and get top 5
      const topCategories = categoryStats
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 5);

      // Calculate percentages
      const totalOrders = topCategories.reduce((sum, cat) => sum + cat.orderCount, 0);
      
      return topCategories.map(cat => ({
        name: cat.name,
        percentage: totalOrders > 0 ? parseInt((cat.orderCount / totalOrders) * 100) : 0
      }));
    } catch (error) {
      console.error('Error fetching top categories:', error);
      return [];
    }
  }
}

module.exports = new AdminDashboardService();
