import type {
  Product,
  Category,
  Brand,
  Review,
} from '@/src/types/index';

// OrderItem interface for admin
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  productId: string;
  product: Product;
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
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Types
export interface ProductsAdminResponse {
  products: Array<Product & {
    category: Category;
    brand?: Brand | null;
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
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

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
    const response = await fetch(`${API_URL}/api/admin/products`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
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

export const adminAPI = {
  products: adminProductsAPI,
  categories: adminCategoriesAPI,
  brands: adminBrandsAPI,
};

export default adminAPI;
