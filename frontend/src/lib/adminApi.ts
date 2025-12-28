import type {
  Product,
  Category,
  Brand,
  Concern,
  Review,
} from '@/src/types/index';

// Order Types for Admin
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  Product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    salePrice: number | null;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  Address: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  OrderItem: OrderItem[];
}

export interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
  totalSpent?: number;
}

export interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function to handle API errors
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Log the status code first
    console.error(`❌ HTTP ${response.status} Error from ${response.url}`);

    // Try to parse JSON; if that fails, use text fallback
    let errorMessage = '';
    try {
      const data = await response.json();
      errorMessage = data.message || data.error || '';
      console.error('📄 API Error Response:', data);
    } catch {
      try {
        const text = await response.text();
        errorMessage = text;
        console.error('📝 API Error Text:', text);
      } catch {
        errorMessage = '';
        console.error('⚠️  No error details available from server');
      }
    }

    // Friendly messages for common auth cases
    if (response.status === 401) {
      const msg = errorMessage || 'Unauthorized: Please log in as admin';
      console.error('🔒 Auth Error (401):', msg);
      throw new Error(msg);
    }
    if (response.status === 403) {
      const msg = errorMessage || 'Forbidden: Insufficient permissions';
      console.error('🚫 Permission Error (403):', msg);
      throw new Error(msg);
    }

    const msg = errorMessage || `HTTP error! status: ${response.status}`;
    console.error(`💥 Final Error (${response.status}):`, msg);
    throw new Error(msg);
  }
  return response.json();
};

// Types
export interface ProductsAdminResponse {
  products: Array<Product & {
    Category: Category;
    Brand?: Brand | null;
    averageRating: number;
    totalReviews: number;
    totalOrders: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ProductAdminDetail extends Product {
  stats: {
    averageRating: number;
    totalReviews: number;
    totalOrders: number;
    totalUnitsSold: number;
    totalRevenue: number;
  };
  reviews: Review[];
  orderItems: OrderItem[];
}

export interface InventoryStats {
  overview: {
    totalProducts: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
  };
  byCategory: Array<{
    category: Category;
    count: number;
  }>;
  byBrand: Array<{
    brand: Brand;
    count: number;
  }>;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock?: number;
  images?: string[];
  featured?: boolean;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  concernId?: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image2?: string;
  image3?: string;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  logo?: string;
}

// Admin Products API
export const adminProductsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    featured?: boolean;
    inStock?: boolean;
    sortBy?: string;
    order?: 'asc' | 'desc';
    search?: string;
  }): Promise<ProductsAdminResponse> => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${API_URL}/api/admin/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<ProductsAdminResponse>(response);
  },

  getById: async (id: string): Promise<ProductAdminDetail> => {
    const response = await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<ProductAdminDetail>(response);
  },

  getStats: async (): Promise<InventoryStats> => {
    const response = await fetch(`${API_URL}/api/admin/products/stats`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<InventoryStats>(response);
  },

  create: async (data: CreateProductRequest): Promise<{ message: string; product: Product }> => {
    console.log('🚀 Creating product with data:', data);
    console.log('📦 Request body:', JSON.stringify(data, null, 2));

    const headers = createHeaders();
    console.log('🔑 Request headers:', headers);
    console.log('🌐 API URL:', `${API_URL}/api/admin/products`);

    const response = await fetch(`${API_URL}/api/admin/products`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    return handleResponse<{ message: string; product: Product }>(response);
  },

  update: async (id: string, data: UpdateProductRequest): Promise<{ message: string; product: Product }> => {
    const response = await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; product: Product }>(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },

  bulkUpdate: async (productIds: string[], updates: UpdateProductRequest): Promise<{ message: string; count: number }> => {
    const response = await fetch(`${API_URL}/api/admin/products/bulk`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ productIds, updates }),
    });
    return handleResponse<{ message: string; count: number }>(response);
  },

  getByCategory: async (categoryId: string, params?: { page?: number; limit?: number }): Promise<ProductsAdminResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await fetch(
      `${API_URL}/api/admin/products/category/${categoryId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<ProductsAdminResponse>(response);
  },

  getByBrand: async (brandId: string, params?: { page?: number; limit?: number }): Promise<ProductsAdminResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const response = await fetch(
      `${API_URL}/api/admin/products/brand/${brandId}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<ProductsAdminResponse>(response);
  },
};

// Admin Categories API
export const adminCategoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'GET',
      headers: createHeaders(),
    });
    const data = await handleResponse<{ categories: Category[] }>(response);
    return data.categories;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Category>(response);
  },

  create: async (data: CreateCategoryRequest): Promise<{ message: string; category: Category }> => {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; category: Category }>(response);
  },

  update: async (id: string, data: Partial<CreateCategoryRequest>): Promise<{ message: string; category: Category }> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; category: Category }>(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Admin Brands API
export const adminBrandsAPI = {
  getAll: async (): Promise<Brand[]> => {
    const response = await fetch(`${API_URL}/api/brands`, {
      method: 'GET',
      headers: createHeaders(),
    });
    const data = await handleResponse<{ brands: Brand[] }>(response);
    return data.brands;
  },

  getById: async (id: string): Promise<Brand> => {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Brand>(response);
  },

  create: async (data: CreateBrandRequest): Promise<{ message: string; brand: Brand }> => {
    const response = await fetch(`${API_URL}/api/brands`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; brand: Brand }>(response);
  },

  update: async (id: string, data: Partial<CreateBrandRequest>): Promise<{ message: string; brand: Brand }> => {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; brand: Brand }>(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Admin Concerns API
export const adminConcernsAPI = {
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
};

// Admin Orders API
export const adminOrdersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ orders: Order[]; pagination: PaginationResponse }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/orders/admin/all${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<{ orders: Order[]; pagination: PaginationResponse }>(response);
  },

  getById: async (id: string): Promise<Order> => {
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<Order>(response);
  },

  updateStatus: async (
    id: string,
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ): Promise<{ message: string; order: Order }> => {
    const response = await fetch(`${API_URL}/api/orders/admin/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<{ message: string; order: Order }>(response);
  },
};

// Admin Customers API
export const adminCustomersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ customers: Customer[]; pagination: PaginationResponse }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/auth/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    const data = await handleResponse<{ users: any[]; pagination: any }>(response);
    // Map users to customers and properly map backend field names
    // Backend returns: _count: { Order: N, Address: N }
    // Frontend expects: _count: { orders: N, reviews: N }
    const customers = data.users.map((user: any) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        orders: user._count?.Order || 0,
        reviews: 0, // Backend doesn't include Review count in getAll
      },
      totalSpent: 0, // Backend doesn't calculate this in getAll
    }));
    return {
      customers,
      pagination: {
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        total: data.pagination.totalUsers,
        hasNext: data.pagination.hasMore,
        hasPrev: data.pagination.currentPage > 1,
      },
    };
  },

  getById: async (id: string): Promise<Customer & { orders: Order[] }> => {
    const response = await fetch(`${API_URL}/api/auth/admin/users/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    const data = await handleResponse<{ user: any }>(response);
    const user = data.user;

    // Map backend response to frontend structure
    // Backend returns: { user: { Order: [...], _count: { Order: N, Review: N } } }
    // Frontend expects: { orders: [...], _count: { orders: N, reviews: N } }

    // Calculate total spent from orders
    const totalSpent = user.Order?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      orders: user.Order || [],
      _count: {
        orders: user._count?.Order || 0,
        reviews: user._count?.Review || 0,
      },
      totalSpent,
    };
  },
}

// Image Upload API
export const uploadAPI = {
  // Upload product images (up to 5 images)
  uploadProductImages: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`${API_URL}/api/admin/products/upload-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return handleResponse<{ urls: string[] }>(response);
  },

  // Upload category images
  uploadCategoryImages: async (files: { image?: File; image2?: File; image3?: File }): Promise<{ image?: string; image2?: string; image3?: string }> => {
    const formData = new FormData();
    if (files.image) formData.append('image', files.image);
    if (files.image2) formData.append('image2', files.image2);
    if (files.image3) formData.append('image3', files.image3);

    const response = await fetch(`${API_URL}/api/categories/upload-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return handleResponse<{ image?: string; image2?: string; image3?: string }>(response);
  },

  // Upload brand logo
  uploadBrandLogo: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${API_URL}/api/brands/upload-logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    return handleResponse<{ url: string }>(response);
  },
};

// Analytics Types
export interface DashboardAnalytics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    customersGrowth: number;
  };
  recentOrders: Order[];
  topProducts: Array<{
    product: Product;
    revenue: number;
    unitsSold: number;
  }>;
  salesByCategory: Array<{
    category: Category;
    revenue: number;
    orderCount: number;
  }>;
}

export interface RevenueTrend {
  period: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product: Product;
  revenue: number;
  unitsSold: number;
  orderCount: number;
}

export interface CategorySales {
  category: Category;
  revenue: number;
  orderCount: number;
  productCount: number;
}

export interface CustomerGrowth {
  period: string;
  newCustomers: number;
  totalCustomers: number;
}

// Admin Analytics API
export const adminAnalyticsAPI = {
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await fetch(`${API_URL}/api/admin/analytics/dashboard`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<DashboardAnalytics>(response);
  },

  getRevenueTrends: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<{ trends: RevenueTrend[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/admin/analytics/revenue${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<{ trends: RevenueTrend[] }>(response);
  },

  getTopProducts: async (params?: {
    limit?: number;
    period?: 'week' | 'month' | 'year';
  }): Promise<{ products: TopProduct[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/admin/analytics/products/top${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<{ products: TopProduct[] }>(response);
  },

  getSalesByCategory: async (): Promise<{ categories: CategorySales[] }> => {
    const response = await fetch(`${API_URL}/api/admin/analytics/categories`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ categories: CategorySales[] }>(response);
  },

  getCustomerGrowth: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<{ growth: CustomerGrowth[] }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/admin/analytics/customers/growth${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<{ growth: CustomerGrowth[] }>(response);
  },

  getRecentOrders: async (params?: { limit?: number }): Promise<{ orders: Order[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) {
      searchParams.append('limit', String(params.limit));
    }

    const response = await fetch(
      `${API_URL}/api/admin/analytics/orders/recent${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse<{ orders: Order[] }>(response);
  },
};

export const adminAPI = {
  products: adminProductsAPI,
  categories: adminCategoriesAPI,
  brands: adminBrandsAPI,
  concerns: adminConcernsAPI,
  orders: adminOrdersAPI,
  customers: adminCustomersAPI,
  upload: uploadAPI,
  analytics: adminAnalyticsAPI,
};

export default adminAPI;