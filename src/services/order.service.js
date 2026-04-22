const prisma = require('../utils/prisma');
const crypto = require('crypto');

class OrderService {
  async createOrder(userId, orderData) {
    const { shippingAddressId, newAddress, paymentMethod = 'STRIPE_CARD' } = orderData;

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cannot place order. Cart is empty.');
      }

      let finalAddressId = shippingAddressId;

      return await prisma.$transaction(async (tx) => {
        
        // Handle New Address Logic
        if (newAddress && !shippingAddressId) {
          const createdAddress = await tx.address.create({
            data: {
              userId,
              type: 'SHIPPING',
              company: newAddress.company || null,
              street: newAddress.street.trim(),
              city: newAddress.city.trim(),
              state: newAddress.state.trim(),
              zipCode: newAddress.zipCode.trim(),
              isDefault: Boolean(newAddress.saveAsDefault) 
            }
          });
          finalAddressId = createdAddress.id;
        } else {
          // Verify Existing Address
          const addressExists = await tx.address.findFirst({
            where: { id: finalAddressId, userId }
          });
          if (!addressExists) {
            throw new Error('Invalid shipping address selected.');
          }
        }

        // Calculate Totals
        let subTotal = 0;
        cart.items.forEach(item => {
          subTotal += parseFloat(item.product.basePrice) * item.quantity;
        });

        const shippingRule = await tx.pricingRule.findFirst({
          where: { name: 'Shipping cost', type: 'FIXED' }
        });
        const shippingCost = shippingRule ? parseFloat(shippingRule.value) : 20.00; 

        const totalAmount = subTotal + shippingCost;
        const orderNumber = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create Final Order
        const newOrder = await tx.order.create({
          data: {
            orderNumber, 
            userId, 
            shippingAddressId: finalAddressId, 
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

        // Clear Cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        
        return newOrder;
      });

    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }
}

module.exports = new OrderService();