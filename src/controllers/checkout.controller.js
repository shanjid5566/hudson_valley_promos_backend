const checkoutService = require('../services/checkout.service');

class CheckoutController {
  async getCheckoutData(req, res) {
    try {
      const userId = req.user.id;
      const checkoutData = await checkoutService.getCheckoutData(userId);
      res.status(200).json({ success: true, data: checkoutData });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CheckoutController();