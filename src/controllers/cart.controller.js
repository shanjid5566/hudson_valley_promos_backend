const cartService = require('../services/cart.service');

class CartController {
  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await cartService.getCartByUserId(userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, quantity, customizationDetails } = req.body;

      if (!productId || !quantity) {
        return res.status(400).json({ 
          success: false, 
          error: 'productId and quantity are required.' 
        });
      }

      const cartItem = await cartService.addToCart(userId, productId, quantity, customizationDetails);
      
      res.status(201).json({ 
        success: true, 
        message: 'Product added to cart successfully', 
        data: cartItem 
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  }

  async updateCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid quantity is required.' 
        });
      }

      const updatedItem = await cartService.updateCartItem(userId, itemId, quantity);
      
      res.status(200).json({ 
        success: true, 
        message: 'Cart item updated successfully', 
        data: updatedItem 
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  }

  async removeCartItem(req, res) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      await cartService.removeCartItem(userId, itemId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Item removed from cart' 
      });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  }

  async clearCart(req, res) {
    try {
      const userId = req.user.id;
      await cartService.clearCart(userId);
      
      res.status(200).json({ 
        success: true, 
        message: 'Cart cleared successfully' 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CartController();