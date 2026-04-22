const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

router.post('/create-checkout-session', verifyUserOrAdminToken, paymentController.createCheckoutSession.bind(paymentController));
router.post('/verify-session', verifyUserOrAdminToken, paymentController.verifySession.bind(paymentController));

module.exports = router;