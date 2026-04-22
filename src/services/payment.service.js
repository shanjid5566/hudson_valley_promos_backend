const prisma = require('../utils/prisma');

// Initialize Stripe lazily to avoid requiring API key at startup
let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured in .env file');
    }
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

class PaymentService {
  async createCheckoutSession(userId, orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId, userId },
        include: { items: { include: { product: true } }, user: true }
      });

      if (!order) throw new Error('Order not found');
      if (order.status !== 'PENDING') throw new Error('Order already processed');

      const lineItems = order.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.product.name },
          unit_amount: Math.round(parseFloat(item.unitPrice) * 100), 
        },
        quantity: item.quantity,
      }));

      if (parseFloat(order.shippingCost) > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Shipping Cost' },
            unit_amount: Math.round(parseFloat(order.shippingCost) * 100),
          },
          quantity: 1,
        });
      }

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: order.user.email,
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        metadata: { orderId: order.id, userId: userId }
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { stripeSessionId: session.id }
      });

      return session;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async verifySessionAndFulfillOrder(userId, sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        throw new Error('Payment has not been completed yet.');
      }

      const orderId = session.metadata.orderId;
      const order = await prisma.order.findUnique({ where: { id: orderId, userId } });

      if (!order) throw new Error('Order not found.');
      if (order.status === 'PROCESSING' || order.status === 'COMPLETED') {
        return { orderId: order.id, status: order.status };
      }

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING', stripePaymentIntentId: session.payment_intent }
        });

        await tx.payment.updateMany({
          where: { orderId: orderId },
          data: {
            status: 'SUCCESS',
            stripeChargeId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            rawStripeResponse: session 
          }
        });

        return o;
      });

      return { orderId: updatedOrder.id, status: updatedOrder.status };
    } catch (error) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();