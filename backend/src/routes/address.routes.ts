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

// All address routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/addresses
 * @desc    Get all addresses for the authenticated user
 * @access  Private
 */
router.get('/', getUserAddresses);

/**
 * @route   GET /api/addresses/:id
 * @desc    Get a specific address by ID
 * @access  Private
 */
router.get('/:id', getAddressById);

/**
 * @route   POST /api/addresses
 * @desc    Create a new address
 * @access  Private
 */
router.post('/', createAddress);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update an address
 * @access  Private
 */
router.put('/:id', updateAddress);

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete an address
 * @access  Private
 */
router.delete('/:id', deleteAddress);

export default router;