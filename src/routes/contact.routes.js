const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

/**
 * Contact Form Routes
 * Base path: /api/contact
 */

router.post('/', contactController.submitContactForm.bind(contactController));

module.exports = router;
