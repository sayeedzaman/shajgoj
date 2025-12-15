// API Response Types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  imageUrl: string | null;
  featured: boolean;
  categoryId: string;
  category: Category;
  brandId: string | null;
  brand: Brand | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithReviews extends Product {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  cartId: string;
  productId: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasMore: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

// API Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  categoryId: string;
  brandId?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}