import { Router } from 'express';
import { register, login, getProfile, updateProfile, getAllUsers, getUserById, updateUser, deleteUser, updateUserRole } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', (req, res, next) => {
  console.log('📞 Profile endpoint hit!', {
    hasAuth: !!req.headers.authorization,
    authHeader: req.headers.authorization?.substring(0, 20) + '...'
  });
  next();
}, authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin routes
router.get('/admin/users', authenticate, authorize('ADMIN'), getAllUsers);
router.get('/admin/users/:id', authenticate, authorize('ADMIN'), getUserById);
router.put('/admin/users/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/admin/users/:id', authenticate, authorize('ADMIN'), deleteUser);
router.put('/admin/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);

export default router;