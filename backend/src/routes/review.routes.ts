import express from 'express';
import {
  getAllReviews,
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  getBatchProductReviewStats,
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/batch/stats', getBatchProductReviewStats); // Must come before /products/:productId
router.get('/products/:productId', getProductReviews);

// Authenticated routes
router.post('/', authenticate, createReview);
router.put('/:reviewId', authenticate, updateReview);
router.delete('/:reviewId', authenticate, deleteReview);
router.get('/user/my-reviews', authenticate, getUserReviews);

// Admin routes (when mounted at /api/admin/reviews)
router.get('/', authenticate, authorize('ADMIN'), getAllReviews);

export default router;
