import express from 'express';
import { getSettings, updateSettings, getPublicShippingSettings, getPublicPaymentSettings } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin routes - require admin authentication
router.get('/', authenticate, authorize('ADMIN'), getSettings);
router.put('/', authenticate, authorize('ADMIN'), updateSettings);

export const publicSettingsRouter = express.Router();

// Public route - storefront needs current delivery charges before login/checkout
publicSettingsRouter.get('/shipping', getPublicShippingSettings);
publicSettingsRouter.get('/payment', getPublicPaymentSettings);

export default router;
