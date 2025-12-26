import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin routes - require admin authentication
router.get('/', authenticate, authorize('ADMIN'), getSettings);
router.put('/', authenticate, authorize('ADMIN'), updateSettings);

export default router;
