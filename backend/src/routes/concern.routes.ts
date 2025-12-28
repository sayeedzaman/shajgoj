import { Router } from 'express';
import {
  getAllConcerns,
  getConcernById,
  searchByConcern,
} from '../controllers/concern.controller.js';

const router = Router();

// Public routes
router.get('/', getAllConcerns);
router.get('/search', searchByConcern);
router.get('/:id', getConcernById);

export default router;
