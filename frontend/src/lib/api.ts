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
  User,
  Category,
  Brand,
  Concern,
  Order,
  CreateOrderRequest,
  Address,
  CreateAddressRequest,
} from '@/src/types/index';

const API_URL = 'http://localhost:5000';

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
    const errorMessage = error.message || `HTTP error! status: ${response.status}`;
    console.error(`API Error (${response.status}):`, errorMessage, error);
    // Include status code in error message for better debugging
    throw new Error(`${response.status}: ${errorMessage}`);
  }
  return response.json();
};

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    console.log('🔐 Attempting login with:', { email: data.email });
    console.log('🌐 API URL:', API_URL);
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    console.log('📡 Login response status:', response.status);
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

  getProfile: async (): Promise<User> => {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<User>(response);
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
    // Try fetching by slug parameter first
    const response = await fetch(`${API_URL}/api/products/${slug}`, {
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
    const data = await handleResponse<{ categories: Category[] }>(response);
    return data.categories || [];
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
    const data = await handleResponse<{ brands: Brand[] }>(response);
    return data.brands || [];
  },

  getById: async (id: string): Promise<Brand> => {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Brand>(response);
  },
};

// Concerns API
export const concernsAPI = {
  getAll: async (): Promise<Concern[]> => {
    const response = await fetch(`${API_URL}/api/concerns`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Concern[]>(response);
  },

  getById: async (id: string): Promise<Concern> => {
    const response = await fetch(`${API_URL}/api/concerns/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Concern>(response);
  },

  searchProducts: async (concernId: string, filters?: Omit<ProductFilters, 'concernId'>): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    params.append('concernId', concernId);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/api/concerns/search?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<ProductsResponse>(response);
  },
};

// Orders API
export const ordersAPI = {
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Order>(response);
  },

  getUserOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    const data = await handleResponse<{ orders: Order[] }>(response);
    return data.orders || [];
  },

  getById: async (id: string): Promise<Order> => {
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<Order>(response);
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await fetch(`${API_URL}/api/orders/${id}/cancel`, {
      method: 'PUT',
      headers: createHeaders(true),
    });
    return handleResponse<Order>(response);
  },
};

// Addresses API
export const addressesAPI = {
  getAll: async (): Promise<Address[]> => {
    const response = await fetch(`${API_URL}/api/addresses`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    const data = await handleResponse<{ addresses: Address[] }>(response);
    return data.addresses || [];
  },

  getById: async (id: string): Promise<Address> => {
    const response = await fetch(`${API_URL}/api/addresses/${id}`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<Address>(response);
  },

  create: async (data: CreateAddressRequest): Promise<Address> => {
    const response = await fetch(`${API_URL}/api/addresses`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Address>(response);
  },

  update: async (id: string, data: Partial<CreateAddressRequest>): Promise<Address> => {
    const response = await fetch(`${API_URL}/api/addresses/${id}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<Address>(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/addresses/${id}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: async (productId: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/api/reviews/products/${productId}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{
      reviews: Array<{
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        updatedAt: string;
        user: {
          firstName: string | null;
          lastName: string | null;
        };
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      statistics: {
        averageRating: number;
        totalReviews: number;
        ratingDistribution: {
          1: number;
          2: number;
          3: number;
          4: number;
          5: number;
        };
      };
    }>(response);
  },

  create: async (productId: string, rating: number, comment?: string) => {
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ productId, rating, comment }),
    });
    return handleResponse<{
      id: string;
      rating: number;
      comment: string | null;
      productId: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }>(response);
  },

  update: async (reviewId: string, rating: number, comment?: string) => {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify({ rating, comment }),
    });
    return handleResponse<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
      updatedAt: string;
    }>(response);
  },

  delete: async (reviewId: string) => {
    const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Wishlist API
export const wishlistAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/api/wishlist`, {
      method: 'GET',
      headers: createHeaders(true),
    });
    return handleResponse<{
      id: string;
      items: Array<{
        id: string;
        productId: string;
        Product: Product;
      }>;
      itemCount: number;
    }>(response);
  },

  addItem: async (productId: string) => {
    const response = await fetch(`${API_URL}/api/wishlist/items`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ productId }),
    });
    return handleResponse<{
      id: string;
      items: Array<{
        id: string;
        productId: string;
        Product: Product;
      }>;
      itemCount: number;
      message: string;
    }>(response);
  },

  removeItem: async (productId: string) => {
    const response = await fetch(`${API_URL}/api/wishlist/items/${productId}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<{
      id: string;
      items: Array<{
        id: string;
        productId: string;
        Product: Product;
      }>;
      itemCount: number;
      message: string;
    }>(response);
  },

  clear: async () => {
    const response = await fetch(`${API_URL}/api/wishlist`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse<{ message: string }>(response);
  },
};

export const api = {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  categories: categoriesAPI,
  brands: brandsAPI,
  concerns: concernsAPI,
  orders: ordersAPI,
  addresses: addressesAPI,
  reviews: reviewsAPI,
  wishlist: wishlistAPI,
};

export default api;