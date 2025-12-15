import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  removeFromCartByProductId, // 🆕 NEW IMPORT
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Cart routes
router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/items/product/:productId', removeFromCartByProductId); // 🆕 NEW ROUTE
router.delete('/', clearCart);

export default router;