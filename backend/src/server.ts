import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import concernRoutes from './routes/concern.routes.js';
import typeSubCategoryRoutes from './routes/type.subcategory.routes.js';
import adminProductRoutes from './routes/admin.product.routes.js';
import orderRoutes from './routes/order.routes.js';
import addressRoutes from './routes/address.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import offerRoutes from './routes/offer.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import reviewRoutes from './routes/review.routes.js';
import chatRoutes from './routes/chat.routes.js';
import './config/cloudinary.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Log environment info for debugging
console.log('Environment Variables Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT, '(using:', PORT, ')');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('- FRONTEND_URLS:', process.env.FRONTEND_URLS);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');

// Middleware
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Log rejected origins for debugging
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/concerns', concernRoutes);
app.use('/api', typeSubCategoryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`
Available routes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Authentication
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/profile (Protected)
  PUT    /api/auth/profile (Protected)

📦 Public Routes
  GET    /api/products
  GET    /api/products/featured
  GET    /api/products/top-selling
  GET    /api/categories
  GET    /api/brands

💚 Wishlist (Require Authentication)
  GET    /api/wishlist
  POST   /api/wishlist/items
  DELETE /api/wishlist/items/:productId
  DELETE /api/wishlist

🔐 Admin Routes (Require Authentication)
  Users:
    GET    /api/auth/admin/users
    GET    /api/auth/admin/users/:id
    PUT    /api/auth/admin/users/:id
    PUT    /api/auth/admin/users/:id/role
    DELETE /api/auth/admin/users/:id

  Categories:
    POST   /api/categories
    PUT    /api/categories/:id
    DELETE /api/categories/:id

  Brands:
    POST   /api/brands
    PUT    /api/brands/:id
    DELETE /api/brands/:id

  Products:
    GET    /api/admin/products
    GET    /api/admin/products/stats
    GET    /api/admin/products/:id
    GET    /api/admin/products/category/:categoryId
    GET    /api/admin/products/brand/:brandId
    POST   /api/admin/products
    PUT    /api/admin/products/:id
    PATCH  /api/admin/products/bulk
    DELETE /api/admin/products/:id

  Orders:
    POST   /api/orders
    GET    /api/orders
    GET    /api/orders/:id
    PUT    /api/orders/:id/cancel
    GET    /api/orders/admin/all
    PUT    /api/orders/admin/:id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});