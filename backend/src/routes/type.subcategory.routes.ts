import express from 'express';
import {
  // Type controllers
  getAllTypes,
  getTypeById,
  getTypesByCategoryId,
  createType,
  updateType,
  deleteType,
  // SubCategory controllers
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoriesByTypeId,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from '../controllers/type.subcategory.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============= TYPE ROUTES =============

// Public routes
router.get('/types', getAllTypes);
router.get('/types/:id', getTypeById);
router.get('/types/category/:categoryId', getTypesByCategoryId);

// Admin routes
router.post('/types', authenticate, authorize('ADMIN'), createType);
router.put('/types/:id', authenticate, authorize('ADMIN'), updateType);
router.delete('/types/:id', authenticate, authorize('ADMIN'), deleteType);

// ============= SUBCATEGORY ROUTES =============

// Public routes
router.get('/subcategories', getAllSubCategories);
router.get('/subcategories/:id', getSubCategoryById);
router.get('/subcategories/type/:typeId', getSubCategoriesByTypeId);

// Admin routes
router.post('/subcategories', authenticate, authorize('ADMIN'), createSubCategory);
router.put('/subcategories/:id', authenticate, authorize('ADMIN'), updateSubCategory);
router.delete('/subcategories/:id', authenticate, authorize('ADMIN'), deleteSubCategory);

export default router;
