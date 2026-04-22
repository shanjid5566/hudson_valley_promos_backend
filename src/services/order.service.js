const prisma = require('../utils/prisma');
const crypto = require('crypto');

class OrderService {
  async createOrder(userId, orderData) {
    const { shippingAddressId, paymentMethod = 'STRIPE_CARD' } = orderData;

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cannot place order. Cart is empty.');
      }

      const address = await prisma.address.findFirst({
        where: { id: shippingAddressId, userId }
      });

      if (!address) throw new Error('Invalid shipping address selected.');

      let subTotal = 0;
      cart.items.forEach(item => {
        subTotal += parseFloat(item.product.basePrice) * item.quantity;
      });

      const shippingRule = await prisma.pricingRule.findFirst({
        where: { name: 'Shipping cost', type: 'FIXED' }
      });
      const shippingCost = shippingRule ? parseFloat(shippingRule.value) : 20.00; 

      const totalAmount = subTotal + shippingCost;
      const orderNumber = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber, 
            userId, 
            shippingAddressId, 
            subTotal, 
            shippingCost, 
            totalAmount,
            status: 'PENDING',
            items: {
              create: cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.product.basePrice,
                customizationDetails: item.customizationDetails
              }))
            },
            payments: {
              create: { amount: totalAmount, method: paymentMethod, status: 'PENDING' }
            }
          }
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        return newOrder;
      });

      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }
}

module.exports = new OrderService();