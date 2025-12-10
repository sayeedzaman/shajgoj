import { Product, User, CartItem, Order, AuthResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Auth
  async register(data: { email: string; password: string; full_name: string; phone?: string; address?: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  // Products
  async getProducts(category?: string): Promise<Product[]> {
    const url = category 
      ? `${API_BASE_URL}/products?category=${category}`
      : `${API_BASE_URL}/products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  }

  async getProduct(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  }

  // Cart
  async getCart(): Promise<CartItem[]> {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  }

  async addToCart(product_id: number, quantity: number = 1): Promise<CartItem> {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ product_id, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  }

  async updateCartItem(productId: number, quantity: number): Promise<CartItem> {
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  }

  async removeFromCart(productId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }

  async getOrder(id: number): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: this.getHeaders(true),
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  }

  async createOrder(data: { items: Array<{ product_id: number; quantity: number; price: number }>; shipping_address: string }): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  }
}

export const api = new ApiClient();
