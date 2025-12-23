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
router.get('/revenue', getRevenueTrends);

// Top selling products
router.get('/products/top', getTopProducts);

// Sales by category
router.get('/categories', getSalesByCategory);

// Customer growth
router.get('/customers/growth', getCustomerGrowth);

// Recent orders
router.get('/orders/recent', getRecentOrders);

export default router;
