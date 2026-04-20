const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

/**
 * Public Categories Routes
 * Base path: /api/categories
 */

// GET all categories with subcategories (public)
router.get('/', categoryController.getAllCategories.bind(categoryController));

// GET single category by ID with subcategories (public)
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

module.exports = router;
