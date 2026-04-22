const orderService = require('../services/order.service');

class OrderController {
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shippingAddressId } = req.body;

      if (!shippingAddressId) {
        return res.status(400).json({ success: false, error: 'Shipping address ID is required.' });
      }

      const order = await orderService.createOrder(userId, req.body);
      res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new OrderController();