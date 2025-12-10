# Quick Start Guide

This guide will help you get the Shajgoj e-commerce platform up and running quickly.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed OR Docker installed
- npm package manager

## Option 1: Quick Start with Docker (Recommended)

### 1. Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- Database: `shajgoj_ecommerce`
- User: `postgres`
- Password: `postgres`

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# The default .env values should work with Docker
# Update if needed:
# DB_PASSWORD=postgres
# JWT_SECRET=change_this_to_a_secure_random_string

# Run migrations to create tables
npm run migrate

# Seed database with sample products
npm run seed

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
# Open a new terminal
cd frontend

# Install dependencies (if not already done)
npm install

# Start frontend server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Option 2: Manual PostgreSQL Setup

### 1. Install and Start PostgreSQL

Make sure PostgreSQL is installed and running on your system.

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shajgoj_ecommerce;

# Exit
\q
```

### 3. Follow steps 2 and 3 from Option 1 above

Update the `.env` file with your PostgreSQL credentials.

## Using the Application

1. Open browser to `http://localhost:3000`
2. **Browse Products**: View the home page and click "Shop Now"
3. **Register**: Click "Sign Up" to create an account
4. **Login**: Use your credentials to login
5. **Add to Cart**: Browse products and add items to your cart
6. **Checkout**: Go to cart and proceed to checkout
7. **View Orders**: Check your order history

## Sample Credentials

After seeding the database, you can create a new user account through the registration page.

## API Testing

You can test the API endpoints using tools like Postman or curl:

### Get all products
```bash
curl http://localhost:5000/api/products
```

### Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Database Connection Issues

- Make sure PostgreSQL is running
- Check database credentials in `backend/.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use

- Backend port 5000: Change `PORT` in `backend/.env`
- Frontend port 3000: Run `npm run dev -- -p 3001`
- PostgreSQL port 5432: Change `DB_PORT` in `backend/.env` and docker-compose.yml

### Module Not Found

- Run `npm install` in both backend and frontend directories
- Delete `node_modules` and `package-lock.json`, then reinstall

## Production Deployment

### Backend

```bash
cd backend
npm install --production
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

### Environment Variables

Remember to update environment variables for production:
- Use strong `JWT_SECRET`
- Update `NEXT_PUBLIC_API_URL` to your production API URL
- Secure database credentials

## Next Steps

- Add more products through the API
- Customize the styling
- Add payment integration
- Implement admin panel
- Add email notifications
- Deploy to production

## Support

For issues and questions, refer to the main README.md or create an issue on GitHub.
