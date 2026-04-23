const reviewService = require('../services/review.service');

class ReviewController {
  async getPendingReviews(req, res) {
    try {
      const userId = req.user.id;
      const products = await reviewService.getPendingReviews(userId);
      
      res.status(200).json({ 
        success: true, 
        data: products 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { productId, rating, comment } = req.body;

      if (!productId || !rating || !comment) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product ID, rating, and comment are required.' 
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rating must be between 1 and 5.' 
        });
      }

      const review = await reviewService.createReview(userId, req.body);
      
      res.status(201).json({ 
        success: true, 
        message: 'Review submitted successfully', 
        data: review 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ReviewController();