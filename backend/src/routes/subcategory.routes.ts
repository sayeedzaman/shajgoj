import express from 'express';
import {
  getAllSubCategories,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../controllers/subcategory.controller.js';
import { authenticateToken, checkAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllSubCategories);
router.get('/:id', getSubCategoryById);

// Admin routes
router.post('/', authenticateToken, checkAdmin, createSubCategory);
router.put('/:id', authenticateToken, checkAdmin, updateSubCategory);
router.delete('/:id', authenticateToken, checkAdmin, deleteSubCategory);

export default router;
