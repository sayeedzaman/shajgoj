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
} from '../controllers/offer.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveOffers);
router.post('/apply', applyOfferCode);

// Admin routes
router.get('/', authenticate, authorize(['ADMIN']), getAllOffers);
router.get('/:id', authenticate, authorize(['ADMIN']), getOfferById);
router.post('/', authenticate, authorize(['ADMIN']), createOffer);
router.put('/:id', authenticate, authorize(['ADMIN']), updateOffer);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteOffer);
router.post('/:id/increment', authenticate, authorize(['ADMIN']), incrementOfferUsage);

export default router;
