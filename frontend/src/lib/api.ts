import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  Product,
  ProductsResponse,
  ProductFilters,
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  Category,
  Brand,
} from '@/src/types/index';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to handle API errors
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  getProfile: async (): Promise<{ user: any }> => {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<{ user: any }>(response);
  },
};

// Products API
export const productsAPI = {
  getAll: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<ProductsResponse>(response);
  },

  getById: async (id: string): Promise<Product> => {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Product>(response);
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await fetch(`${API_URL}/api/products/slug/${slug}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Product>(response);
  },

  getFeatured: async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/api/products?featured=true&limit=8`, {
      method: 'GET',
      headers: createHeaders(),
    });
    const data = await handleResponse<ProductsResponse>(response);
    return data.products;
  },
};

// Cart API
export const cartAPI = {
  get: async (): Promise<Cart> => {
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<Cart>(response);
  },

  addItem: async (data: AddToCartRequest): Promise<Cart> => {
    const response = await fetch(`${API_URL}/api/cart/items`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Cart>(response);
  },

  updateItem: async (itemId: string, data: UpdateCartItemRequest): Promise<Cart> => {
    const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Cart>(response);
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<Cart>(response);
  },

  clear: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Category[]>(response);
  },

  getById: async (id: string): Promise<Category> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Category>(response);
  },
};

// Brands API
export const brandsAPI = {
  getAll: async (): Promise<Brand[]> => {
    const response = await fetch(`${API_URL}/api/brands`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Brand[]>(response);
  },

  getById: async (id: string): Promise<Brand> => {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Brand>(response);
  },
};

export const api = {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  categories: categoriesAPI,
  brands: brandsAPI,
};

export default api;