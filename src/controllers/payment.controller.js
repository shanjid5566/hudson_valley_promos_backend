const paymentService = require('../services/payment.service');

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required.' });
      }

      const session = await paymentService.createCheckoutSession(userId, orderId);
      res.status(200).json({ success: true, data: { url: session.url, sessionId: session.id } });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async verifySession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID is required.' });
      }

      const result = await paymentService.verifySessionAndFulfillOrder(userId, sessionId);
      res.status(200).json({ success: true, message: 'Payment verified', data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PaymentController();