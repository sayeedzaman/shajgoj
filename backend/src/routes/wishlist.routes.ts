import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', getWishlist);

// Add item to wishlist
router.post('/items', addToWishlist);

// Remove item from wishlist
router.delete('/items/:productId', removeFromWishlist);

// Clear wishlist
router.delete('/', clearWishlist);

export default router;
