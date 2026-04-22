const prisma = require('../utils/prisma');

class CartService {
  async getCartByUserId(userId) {
    try {
      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  images: true,
                  category: {
                    select: { name: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: { items: true }
        });
      }

      return cart;
    } catch (error) {
      throw new Error(`Failed to fetch cart: ${error.message}`);
    }
  }

  async addToCart(userId, productId, quantity, customizationDetails = {}) {
    try {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      let cart = await prisma.cart.findUnique({ where: { userId } });
      
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
      }

      // Create a new cart item. 
      // For dynamic customized products, we create a new row for each addition
      // because customizations (like uploaded artwork) are typically unique per request.
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: parseInt(quantity, 10),
          customizationDetails
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              images: true
            }
          }
        }
      });

      return cartItem;
    } catch (error) {
      throw new Error(`Failed to add item to cart: ${error.message}`);
    }
  }

  async updateCartItem(userId, itemId, quantity) {
    try {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true }
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new Error('Cart item not found or unauthorized');
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: parseInt(quantity, 10) },
        include: {
          product: {
            select: { id: true, name: true, basePrice: true }
          }
        }
      });

      return updatedItem;
    } catch (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }
  }

  async removeCartItem(userId, itemId) {
    try {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true }
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new Error('Cart item not found or unauthorized');
      }

      await prisma.cartItem.delete({
        where: { id: itemId }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to remove cart item: ${error.message}`);
    }
  }

  async clearCart(userId) {
    try {
      const cart = await prisma.cart.findUnique({ where: { userId } });
      
      if (!cart) return true;

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }
}

module.exports = new CartService();