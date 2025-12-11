import 'dotenv/config';  // Load this FIRST, before any other imports
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import { authenticate, authorize } from './middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Example protected route
app.get('/api/admin', authenticate, authorize(Role.ADMIN), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Shajgoj API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});