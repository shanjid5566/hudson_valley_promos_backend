const adminDashboardService = require('../services/dashboard.service');

/**
 * Admin Dashboard Controller
 * Handles HTTP requests for dashboard data
 */
class AdminDashboardController {
  /**
   * Get dashboard overview
   * @route GET /api/admin/dashboard/overview
   */
  async getDashboardOverview(req, res, next) {
    try {
      const overview = await adminDashboardService.getDashboardOverview();

      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AdminDashboardController();
