const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

/**
 * Review Routes
 * Base path: /api/reviews
 */

// GET products waiting to be reviewed by the logged-in user
router.get('/pending', verifyUserOrAdminToken, reviewController.getPendingReviews.bind(reviewController));

// POST submit a new review
router.post('/', verifyUserOrAdminToken, reviewController.createReview.bind(reviewController));

module.exports = router;