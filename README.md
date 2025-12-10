# Shajgoj E-commerce Platform

Full-stack e-commerce platform built with Next.js (frontend), Node.js/Express (backend), and PostgreSQL (database).

## Features

- 🛍️ Product browsing and search with category filtering
- 🛒 Shopping cart functionality
- 👤 User authentication (register/login)
- 📦 Order management
- 💳 Checkout process
- 📱 Responsive design with Tailwind CSS
- 🔒 JWT-based authentication
- 🗄️ PostgreSQL database with proper relationships

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **pg** - PostgreSQL client

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## Project Structure

```
shajgoj/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Entry point
│   ├── scripts/            # Database scripts
│   │   ├── migrate.js      # Create tables
│   │   └── seed.js         # Seed data
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=shajgoj_ecommerce
JWT_SECRET=your_secret_key_here
```

5. Create the database:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shajgoj_ecommerce;
\q
```

6. Run migrations to create tables:
```bash
npm run migrate
```

7. Seed the database with sample products:
```bash
npm run seed
```

8. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=Electronics` - Filter by category
- `GET /api/products/:id` - Get single product

### Cart
- `GET /api/cart` - Get user's cart (protected)
- `POST /api/cart` - Add item to cart (protected)
- `PUT /api/cart/:productId` - Update cart item quantity (protected)
- `DELETE /api/cart/:productId` - Remove item from cart (protected)

### Orders
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)
- `POST /api/orders` - Create new order (protected)

## Database Schema

### Users
- id, email, password_hash, full_name, phone, address, created_at, updated_at

### Products
- id, name, description, price, category, image_url, stock_quantity, created_at, updated_at

### Orders
- id, user_id, total_amount, status, shipping_address, created_at, updated_at

### Order Items
- id, order_id, product_id, quantity, price, created_at

### Cart
- id, user_id, product_id, quantity, created_at, updated_at

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Products**: View all products or filter by category
3. **Add to Cart**: Select products and add them to your cart
4. **Checkout**: Review cart and complete the order with shipping address
5. **View Orders**: Track your order history

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start Next.js dev server
```

## Production Deployment

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT
- `JWT_EXPIRES_IN` - Token expiration time

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## License

MIT

## Author

Shajgoj Team

