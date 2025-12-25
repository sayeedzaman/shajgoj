import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getAllReviews,
  adminDeleteReview,
  getReviewStats,
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Authenticated user routes
router.post('/', authenticate, createReview);
router.get('/my-reviews', authenticate, getUserReviews);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllReviews);
router.get('/admin/stats', authenticate, authorize('ADMIN'), getReviewStats);
router.delete('/admin/:reviewId', authenticate, authorize('ADMIN'), adminDeleteReview);

export default router;
