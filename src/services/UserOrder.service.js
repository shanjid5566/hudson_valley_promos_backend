const prisma = require("../utils/prisma");
const crypto = require("crypto");
const { calculateItemPrice, calculateOrderPricing } = require("../utils/pricing");

class OrderService {
  async getUserOrders(userId) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }, // Show newest orders first
        include: {
          shippingAddress: true,
          payments: {
            select: {
              method: true,
              status: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      });
      return orders;
    } catch (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`);
    }
  }
  async createOrder(userId, orderData) {
    const {
      shippingAddressId,
      newAddress,
      paymentMethod = "STRIPE_CARD",
    } = orderData;

    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { 
          items: { 
            include: { 
              product: {
                include: {
                  pricingTiers: {
                    orderBy: { minQuantity: 'asc' }
                  }
                }
              }
            } 
          } 
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cannot place order. Cart is empty.");
      }

      let finalAddressId = shippingAddressId;

      return await prisma.$transaction(async (tx) => {
        // Handle New Address Logic
        if (newAddress && !shippingAddressId) {
          const createdAddress = await tx.address.create({
            data: {
              userId,
              type: "SHIPPING",
              company: newAddress.company || null,
              street: newAddress.street.trim(),
              city: newAddress.city.trim(),
              state: newAddress.state.trim(),
              zipCode: newAddress.zipCode.trim(),
              isDefault: Boolean(newAddress.saveAsDefault),
            },
          });
          finalAddressId = createdAddress.id;
        } else {
          // Verify Existing Address
          const addressExists = await tx.address.findFirst({
            where: { id: finalAddressId, userId },
          });
          if (!addressExists) {
            throw new Error("Invalid shipping address selected.");
          }
        }

        // Calculate pricing with tiers and rules
        const hasCustomization = cart.items.some(
          item => item.customizationDetails && Object.keys(item.customizationDetails).length > 0
        );

        const orderPricing = await calculateOrderPricing(cart.items, { hasCustomization });

        const orderNumber =
          "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

        // Create Final Order with calculated prices
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            shippingAddressId: finalAddressId,
            subTotal: orderPricing.subTotal,
            shippingCost: orderPricing.shippingCost,
            totalAmount: orderPricing.totalAmount,
            status: "PENDING",
            items: {
              create: cart.items.map((item) => {
                const pricing = calculateItemPrice(item.product, item.quantity);
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: pricing.unitPrice, // Use calculated tiered price
                  customizationDetails: item.customizationDetails,
                };
              }),
            },
            payments: {
              create: {
                amount: orderPricing.totalAmount,
                method: paymentMethod,
                status: "PENDING",
              },
            },
          },
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
