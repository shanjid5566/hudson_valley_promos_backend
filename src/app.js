const express = require('express');

// Initialize Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const userRoutes = require('./routes/user.routes');
const adminServicesRoutes = require('./routes/adminServices.routes');
const adminCategoriesRoutes = require('./routes/adminCategories.routes');
const adminSubcategoriesRoutes = require('./routes/adminSubcategories.routes');
const adminPricingRulesRoutes = require('./routes/adminPricingRules.routes');
const adminMaterialsRoutes = require('./routes/adminMaterials.routes');
const adminPrintingMethodsRoutes = require('./routes/adminPrintingMethods.routes');
const adminOrdersRoutes = require('./routes/adminOrders.routes');
const adminSubcategoriesController = require('./controllers/adminSubcategories.controller');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/admin/services', adminServicesRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/subcategories', adminSubcategoriesRoutes);
app.use('/api/admin/pricing-rules', adminPricingRulesRoutes);
app.use('/api/admin/materials', adminMaterialsRoutes);
app.use('/api/admin/printing-methods', adminPrintingMethodsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);

// Nested route: Get subcategories of a specific category
app.get('/api/admin/categories/:id/subcategories', adminSubcategoriesController.getSubcategoriesByCategory.bind(adminSubcategoriesController));

// 404 handler - catch all undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
