import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import adminProductRoutes from './routes/admin.product.routes.js';
import orderRoutes from './routes/order.routes.js';
import addressRoutes from './routes/address.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`
Available routes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Authentication
  POST   /api/auth/register
  POST   /api/auth/login

📦 Public Routes
  GET    /api/products
  GET    /api/products/featured
  GET    /api/products/top-selling
  GET    /api/categories
  GET    /api/brands

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