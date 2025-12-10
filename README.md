# E-commerce Platform

Full-stack e-commerce website built with Next.js and Node.js, similar to Shajgoj.

## Project Structure
```
ecommerce-platform/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js + Express backend API
└── README.md
```

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Node.js & Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running

### Setup

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/ecommerce-platform.git
   cd ecommerce-platform
```

2. **Setup Backend**
```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run prisma:migrate
   npm run dev
```
   Backend will run on: http://localhost:5000

3. **Setup Frontend**
```bash
   cd ../frontend
   npm install
   cp .env.local.example .env.local
   # Edit .env.local with API URL
   npm run dev
```
   Frontend will run on: http://localhost:3000

## Development

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Features

- [ ] User Authentication (Register/Login)
- [ ] Product Catalog with Categories
- [ ] Product Search & Filtering
- [ ] Shopping Cart
- [ ] Order Management
- [ ] User Profile & Addresses
- [ ] Product Reviews & Ratings
- [ ] Admin Dashboard
- [ ] Payment Integration

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## License

None