import express from 'express';
import {
  getAllBrands,
  getBrandById,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandLogo,
} from '../controllers/category.brand.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllBrands);
router.get('/slug/:slug', getBrandBySlug);
router.get('/:id', getBrandById);

// Admin routes
router.post(
  '/upload-logo',
  authenticate,
  authorize('ADMIN'),
  upload.single('logo'),
  uploadBrandLogo
);
router.post('/', authenticate, authorize('ADMIN'), createBrand);
router.put('/:id', authenticate, authorize('ADMIN'), updateBrand);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBrand);

export default router;