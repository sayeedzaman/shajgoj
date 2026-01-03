import express from 'express';
import {
  getActiveOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  applyOfferCode,
  incrementOfferUsage,
  uploadOfferImage,
} from '../controllers/offer.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveOffers);
router.get('/:id', getOfferById); // Public route for viewing offer details
router.post('/apply', applyOfferCode);

// Admin routes
router.post(
  '/upload-image',
  authenticate,
  authorize('ADMIN'),
  upload.single('image'),
  uploadOfferImage
);
router.get('/', authenticate, authorize('ADMIN'), getAllOffers);
router.post('/', authenticate, authorize('ADMIN'), createOffer);
router.put('/:id', authenticate, authorize('ADMIN'), updateOffer);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteOffer);
router.post('/:id/increment', authenticate, authorize('ADMIN'), incrementOfferUsage);

export default router;
