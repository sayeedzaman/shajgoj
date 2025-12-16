import express from 'express';
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/category.brand.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), createBrand);
router.put('/:id', authenticate, authorize('ADMIN'), updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBrand);

export default router;