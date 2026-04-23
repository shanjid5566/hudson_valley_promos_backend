const prisma = require('../utils/prisma');
const { calculateItemPrice, calculateOrderPricing } = require('../utils/pricing');

class CheckoutService {
  async getCheckoutData(userId) {
    try {
      const cart = await prisma.cart.findUnique({
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
                  pricingTiers: {
                    orderBy: { minQuantity: 'asc' }
                  }
                }
              }
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Your cart is empty. Please add items to proceed.');
      }

      // Calculate pricing for each item
      const itemsWithPricing = cart.items.map(item => {
        const pricing = calculateItemPrice(item.product, item.quantity);
        return {
          ...item,
          unitPrice: pricing.unitPrice,
          itemSubtotal: pricing.itemSubtotal
        };
      });

      // Calculate order totals with all fees
      const hasCustomization = cart.items.some(
        item => item.customizationDetails && Object.keys(item.customizationDetails).length > 0
      );

      const orderPricing = await calculateOrderPricing(cart.items, { hasCustomization });

      const savedAddresses = await prisma.address.findMany({
        where: { 
          userId: userId,
          isDefault: true 
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      return { 
        cart: {
          ...cart,
          items: itemsWithPricing
        },
        pricing: orderPricing,
        savedAddresses 
      };
    } catch (error) {
      throw new Error(`Failed to fetch checkout data: ${error.message}`);
    }
  }
}

module.exports = new CheckoutService();