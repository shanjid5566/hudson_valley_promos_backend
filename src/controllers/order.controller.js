const orderService = require('../services/order.service');

class OrderController {
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { shippingAddressId, newAddress, paymentMethod } = req.body;

      if (!shippingAddressId && !newAddress) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please provide either an existing shippingAddressId or a newAddress object.' 
        });
      }

      if (newAddress && !shippingAddressId) {
        const requiredFields = ['street', 'city', 'state', 'zipCode'];
        for (const field of requiredFields) {
          if (!newAddress[field]) {
            return res.status(400).json({ 
              success: false, 
              error: `New address is missing required field: ${field}` 
            });
          }
        }
      }

      const order = await orderService.createOrder(userId, req.body);
      
      res.status(201).json({ 
        success: true, 
        message: 'Order created successfully', 
        data: order 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new OrderController();