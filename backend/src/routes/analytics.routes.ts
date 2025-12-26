import express from 'express';
import { authenticate, checkAdmin } from '../middleware/auth.middleware.js';
import {
  getDashboardAnalytics,
  getRevenueTrends,
  getTopProducts,
  getSalesByCategory,
  getCustomerGrowth,
  getRecentOrders,
} from '../controllers/analytics.controller.js';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(authenticate, checkAdmin);

// Dashboard analytics overview
router.get('/dashboard', getDashboardAnalytics);

// Revenue trends over time
router.get('/revenue-trends', getRevenueTrends);
router.get('/revenue', getRevenueTrends);

// Top selling products
router.get('/top-products', getTopProducts);
router.get('/products/top', getTopProducts);

// Sales by category
router.get('/sales-by-category', getSalesByCategory);
router.get('/categories', getSalesByCategory);

// Customer growth
router.get('/customer-growth', getCustomerGrowth);
router.get('/customers/growth', getCustomerGrowth);

// Recent orders
router.get('/recent-orders', getRecentOrders);
router.get('/orders/recent', getRecentOrders);

export default router;
