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
  image2?: string | null;
  image3?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Type {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  categoryId: string;
  Category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Concern {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  typeId: string;
  Type?: Type;
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
  typeId: string;
  subCategoryId: string;
  Category: Category;
  Type?: {
    id: string;
    name: string;
    slug: string;
  };
  SubCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  brandId: string | null;
  Brand: Brand | null;
  concernId?: string | null;
  Concern?: Concern | null;
  totalSold?: number;
  orderCount?: number;
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
  product: Product & {
    brand: Brand | null;
    category: Category;
  };
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
  subCategoryId: string; // Required - backend auto-populates categoryId and typeId from this
  categoryId?: string; // Optional - for backward compatibility
  typeId?: string; // Optional - for backward compatibility
  brandId?: string;
  concernId?: string;
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
  typeId?: string;
  subCategoryId?: string;
  brandId?: string;
  concernId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Address Types
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  userId: string;
}

export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  addressId: string;
  Address?: Address;
  OrderItem: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  productId: string;
  Product: Product;
}

export interface CreateOrderRequest {
  addressId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}