import express from 'express';
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/address.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * All routes require authentication
 */

/**
 * @route   GET /api/addresses
 * @desc    Get all addresses for authenticated user
 * @access  Private
 */
router.get('/', authenticate, getUserAddresses);

/**
 * @route   GET /api/addresses/:id
 * @desc    Get single address by ID
 * @access  Private
 */
router.get('/:id', authenticate, getAddressById);

/**
 * @route   POST /api/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post('/', authenticate, createAddress);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put('/:id', authenticate, updateAddress);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete('/:id', authenticate, deleteAddress);

export default router;
