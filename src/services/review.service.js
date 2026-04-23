const prisma = require('../utils/prisma');

class ReviewService {
  
  async getPendingReviews(userId) {
    try {
      const completedOrders = await prisma.order.findMany({
        where: {
          userId: userId,
          status: 'COMPLETED' 
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true, basePrice: true }
              }
            }
          }
        }
      });

      const boughtProductsMap = new Map();
      completedOrders.forEach(order => {
        order.items.forEach(item => {
          boughtProductsMap.set(item.product.id, item.product);
        });
      });

      const boughtProductIds = Array.from(boughtProductsMap.keys());

      const existingReviews = await prisma.review.findMany({
        where: {
          userId: userId,
          productId: { in: boughtProductIds }
        },
        select: { productId: true }
      });

      const reviewedProductIds = new Set(existingReviews.map(r => r.productId));

      const pendingProducts = [];
      boughtProductsMap.forEach((product, productId) => {
        if (!reviewedProductIds.has(productId)) {
          pendingProducts.push(product);
        }
      });

      return pendingProducts;
    } catch (error) {
      throw new Error(`Failed to fetch pending reviews: ${error.message}`);
    }
  }

  async createReview(userId, data) {
    const { productId, rating, comment } = data;

    try {
      const existingReview = await prisma.review.findFirst({
        where: { userId, productId }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this product.');
      }

      const hasBought = await prisma.orderItem.findFirst({
        where: {
          order: { userId, status: 'COMPLETED' },
          productId
        }
      });

      if (!hasBought) {
        throw new Error('You can only review products you have purchased and received.');
      }

      const review = await prisma.review.create({
        data: {
          userId,
          productId,
          rating: parseInt(rating, 10),
          comment: comment.trim(),
          isApproved: true 
        }
      });

      return review;
    } catch (error) {
      throw new Error(`Failed to submit review: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();