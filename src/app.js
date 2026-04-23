const express = require("express");
const path = require("path");

// Initialize Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Import routes
const userRoutes = require("./routes/user.routes");
const adminServicesRoutes = require("./routes/services.routes");
const adminCategoriesRoutes = require("./routes/categories.routes");
const productsPublicRoutes = require("./routes/products-public.routes");
const adminSubcategoriesRoutes = require("./routes/subcategories.routes");
const adminPricingRulesRoutes = require("./routes/pricingRules.routes");
const adminOrdersRoutes = require("./routes/orders.routes");
const adminDashboardRoutes = require("./routes/dashboard.routes");
const adminSubcategoriesController = require("./controllers/subcategories.controller");
const adminAttributesRoutes = require("./routes/attributes.routes");
const productStepsRoutes = require("./routes/productSteps.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const orderRoutes = require("./routes/userOrder.routes");
const paymentRoutes = require("./routes/payment.routes");

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/products", productsPublicRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/services", adminServicesRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/subcategories", adminSubcategoriesRoutes);
app.use("/api/admin/pricing-rules", adminPricingRulesRoutes);
app.use("/api/admin/attributes", adminAttributesRoutes);
app.use("/api/admin/product-steps", productStepsRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/user/cart", cartRoutes);
app.use("/api/user/checkout", checkoutRoutes);
app.use("/api/user/order", orderRoutes);
app.use("/api/user/payment", paymentRoutes);

// Nested route: Get subcategories of a specific category
app.get(
  "/api/admin/categories/:id/subcategories",
  adminSubcategoriesController.getSubcategoriesByCategory.bind(
    adminSubcategoriesController,
  ),
);

// 404 handler - catch all undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
