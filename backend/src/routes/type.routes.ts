import express from 'express';
import {
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType,
} from '../controllers/type.controller.js';
import { authenticateToken, checkAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllTypes);
router.get('/:id', getTypeById);

// Admin routes
router.post('/', authenticateToken, checkAdmin, createType);
router.put('/:id', authenticateToken, checkAdmin, updateType);
router.delete('/:id', authenticateToken, checkAdmin, deleteType);

export default router;
