import express from 'express';
import {
  getActiveOffers,
  getOffer,
  validateOfferCode,
  applyOffer,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  updateOfferStatus,
  getOfferStats,
  updateExpiredOffers,
} from '../controllers/offer.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveOffers);
router.get('/:identifier', getOffer);
router.post('/validate', validateOfferCode);

// Authenticated routes
router.post('/apply', authenticate, applyOffer);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllOffers);
router.get('/admin/stats', authenticate, authorize('ADMIN'), getOfferStats);
router.post('/admin/create', authenticate, authorize('ADMIN'), createOffer);
router.put('/admin/:offerId', authenticate, authorize('ADMIN'), updateOffer);
router.patch('/admin/:offerId/status', authenticate, authorize('ADMIN'), updateOfferStatus);
router.delete('/admin/:offerId', authenticate, authorize('ADMIN'), deleteOffer);
router.post('/admin/update-expired', authenticate, authorize('ADMIN'), updateExpiredOffers);

export default router;
