import { Router } from 'express';
import { register, login, getProfile, getAllUsers, getUserById, updateUser, deleteUser, updateUserRole } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);

// Admin routes
router.get('/admin/users', authenticate, authorize('ADMIN'), getAllUsers);
router.get('/admin/users/:id', authenticate, authorize('ADMIN'), getUserById);
router.put('/admin/users/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/admin/users/:id', authenticate, authorize('ADMIN'), deleteUser);
router.put('/admin/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);

export default router;