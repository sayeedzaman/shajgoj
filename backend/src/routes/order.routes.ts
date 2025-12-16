import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * User Routes (Require Authentication)
 */

/**
 * @route   POST /api/orders
 * @desc    Create a new order (place order)
 * @access  Private (User)
 */
router.post('/', authenticate, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated user
 * @access  Private (User)
 */
router.get('/', authenticate, getUserOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get a specific order by ID (only user's own order)
 * @access  Private (User)
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order (only if status is PENDING)
 * @access  Private (User)
 */
router.put('/:id/cancel', authenticate, cancelOrder);

/**
 * Admin Routes (Require Admin Authentication)
 */

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders (for admin dashboard)
 * @access  Private (Admin only)
 */
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllOrders);

/**
 * @route   PUT /api/admin/orders/:id
 * @desc    Update order status (admin marks as delivered, etc.)
 * @access  Private (Admin only)
 */
router.put('/admin/:id', authenticate, authorize('ADMIN'), updateOrderStatus);

export default router;