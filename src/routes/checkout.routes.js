const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

router.get('/', verifyUserOrAdminToken, checkoutController.getCheckoutData.bind(checkoutController));

module.exports = router;