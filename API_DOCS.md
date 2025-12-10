# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Health Check

#### GET /
Get API information

**Response:**
```json
{
  "message": "Shajgoj E-commerce API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "products": "/api/products",
    "cart": "/api/cart",
    "orders": "/api/orders"
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Login user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/profile
Get current user profile (Protected)

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/auth/profile
Update user profile (Protected)

**Request Body:**
```json
{
  "full_name": "John Smith",
  "phone": "+0987654321",
  "address": "456 Oak Ave, City, Country"
}
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Smith",
  "phone": "+0987654321",
  "address": "456 Oak Ave, City, Country",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

## Product Endpoints

### GET /api/products
Get all products

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "Electronics", "Accessories")

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "price": 79.99,
    "category": "Electronics",
    "image_url": "https://images.unsplash.com/photo-...",
    "stock_quantity": 50,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/products/:id
Get single product

**Response (200):**
```json
{
  "id": 1,
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": 79.99,
  "category": "Electronics",
  "image_url": "https://images.unsplash.com/photo-...",
  "stock_quantity": 50,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/products
Create a new product (Protected - Admin)

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "image_url": "https://example.com/image.jpg",
  "stock_quantity": 100
}
```

### PUT /api/products/:id
Update a product (Protected - Admin)

**Request Body:**
```json
{
  "name": "Updated Product",
  "description": "Updated description",
  "price": 89.99,
  "category": "Electronics",
  "image_url": "https://example.com/image.jpg",
  "stock_quantity": 80
}
```

### DELETE /api/products/:id
Delete a product (Protected - Admin)

**Response (204):** No content

---

## Cart Endpoints

### GET /api/cart
Get user's cart items (Protected)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "product_id": 1,
    "quantity": 2,
    "name": "Wireless Headphones",
    "price": 79.99,
    "image_url": "https://images.unsplash.com/photo-...",
    "stock_quantity": 50,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/cart
Add item to cart (Protected)

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "product_id": 1,
  "quantity": 2,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/cart/:productId
Update cart item quantity (Protected)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "product_id": 1,
  "quantity": 3,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/cart/:productId
Remove item from cart (Protected)

**Response (204):** No content

### DELETE /api/cart
Clear entire cart (Protected)

**Response (204):** No content

---

## Order Endpoints

### GET /api/orders
Get user's orders (Protected)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "total_amount": 159.98,
    "status": "pending",
    "shipping_address": "123 Main St, City, Country",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/orders/:id
Get single order with items (Protected)

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "total_amount": 159.98,
  "status": "pending",
  "shipping_address": "123 Main St, City, Country",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "quantity": 2,
      "price": 79.99,
      "name": "Wireless Headphones",
      "image_url": "https://images.unsplash.com/photo-...",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/orders
Create a new order (Protected)

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 79.99
    }
  ],
  "shipping_address": "123 Main St, City, Country"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "total_amount": 159.98,
  "status": "pending",
  "shipping_address": "123 Main St, City, Country",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/orders/:id/status
Update order status (Protected - Admin)

**Request Body:**
```json
{
  "status": "shipped"
}
```

**Valid status values:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "total_amount": 159.98,
  "status": "shipped",
  "shipping_address": "123 Main St, City, Country",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": "..."
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- All prices are in USD (decimal with 2 decimal places)
- Authentication tokens expire after 7 days by default
- Products are automatically removed from stock when orders are placed
- Cart is automatically cleared after successful order creation
