const prisma = require('../utils/prisma');

class CheckoutService {
  async getCheckoutData(userId) {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, basePrice: true, images: true }
              }
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }

      const savedAddresses = await prisma.address.findMany({
        where: { 
          userId: userId,
          isDefault: true 
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      return { cart, savedAddresses };
    } catch (error) {
      throw new Error(`Failed to fetch checkout data: ${error.message}`);
    }
  }
}

module.exports = new CheckoutService();