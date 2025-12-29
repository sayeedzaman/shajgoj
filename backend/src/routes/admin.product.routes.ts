import express from 'express';
import {
  getAllProductsAdmin,
  getProductByIdAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductsByType,
  getProductsBySubCategory,
  getInventoryStats,
  uploadProductImages,
} from '../controllers/admin.product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @route   GET /api/admin/products
 * @desc    Get all products with filtering and pagination
 * @access  Admin
 */
router.get('/', getAllProductsAdmin);

/**
 * @route   GET /api/admin/products/stats
 * @desc    Get inventory statistics
 * @access  Admin
 */
router.get('/stats', getInventoryStats);

/**
 * @route   GET /api/admin/products/category/:categoryId
 * @desc    Get products by category
 * @access  Admin
 */
router.get('/category/:categoryId', getProductsByCategory);

/**
 * @route   GET /api/admin/products/brand/:brandId
 * @desc    Get products by brand
 * @access  Admin
 */
router.get('/brand/:brandId', getProductsByBrand);

/**
 * @route   GET /api/admin/products/type/:typeId
 * @desc    Get products by type
 * @access  Admin
 */
router.get('/type/:typeId', getProductsByType);

/**
 * @route   GET /api/admin/products/subcategory/:subCategoryId
 * @desc    Get products by subcategory
 * @access  Admin
 */
router.get('/subcategory/:subCategoryId', getProductsBySubCategory);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Get single product with detailed statistics
 * @access  Admin
 */
router.get('/:id', getProductByIdAdmin);

/**
 * @route   POST /api/admin/products/upload-images
 * @desc    Upload product images to Cloudinary
 * @access  Admin
 */
router.post('/upload-images', (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      return res.status(400).json({
        error: err.message || 'File upload failed',
        details: err.toString()
      });
    }
    next();
  });
}, uploadProductImages);

/**
 * @route   POST /api/admin/products
 * @desc    Create new product
 * @access  Admin
 */
router.post('/', createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update product
 * @access  Admin
 */
router.put('/:id', updateProduct);

/**
 * @route   PATCH /api/admin/products/bulk
 * @desc    Bulk update multiple products
 * @access  Admin
 */
router.patch('/bulk', bulkUpdateProducts);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Admin
 */
router.delete('/:id', deleteProduct);

export default router;