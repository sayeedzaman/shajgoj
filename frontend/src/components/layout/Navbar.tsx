'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { useWishlist } from '@/src/lib/WishlistContext';
import { ShoppingCart, User, Search, Heart, LogOut, Plus, Minus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Category, Product } from '@/src/types';
import WishlistSidebar from '@/src/components/wishlist/WishlistSidebar';

interface Type {
  id: string;
  name: string;
  slug: string;
  SubCategory?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryWithHierarchy extends Category {
  Type?: Type[];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, openCart, addToCart } = useCart();
  const { wishlistCount, wishlist, removeFromWishlist } = useWishlist();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [instantResults, setInstantResults] = useState<Product[]>([]);
  const [showInstantResults, setShowInstantResults] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryWithHierarchy[]>([]);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; }[]>([]);
  const [isBrandsHovered, setIsBrandsHovered] = useState(false);
  const brandsButtonRef = useRef<HTMLDivElement>(null);
  const [brandsDropdownPosition, setBrandsDropdownPosition] = useState({ top: 0, left: 0 });
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCategories = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Fetch categories
      const categoriesResponse = await fetch(`${apiUrl}/api/categories`);
      if (!categoriesResponse.ok) return;

      const categoriesData = await categoriesResponse.json();
      const categoriesList = categoriesData.categories || [];

      // Fetch types and subcategories for each category
      const categoriesWithHierarchy = await Promise.all(
        categoriesList.map(async (category: Category) => {
          try {
            // Fetch types for this category
            const typesResponse = await fetch(`${apiUrl}/api/types?categoryId=${category.id}`);
            if (!typesResponse.ok) return { ...category, Type: [] };

            const typesData = await typesResponse.json();
            const typesList = typesData.types || [];

            // Fetch subcategories for each type
            const typesWithSubCategories = await Promise.all(
              typesList.map(async (type: Type) => {
                try {
                  const subCategoriesResponse = await fetch(`${apiUrl}/api/subcategories/type/${type.id}`);
                  if (!subCategoriesResponse.ok) return { ...type, SubCategory: [] };

                  const subCategoriesData = await subCategoriesResponse.json();
                  return { ...type, SubCategory: subCategoriesData.subcategories || [] };
                } catch (error) {
                  console.error(`Failed to fetch subcategories for type ${type.id}:`, error);
                  return { ...type, SubCategory: [] };
                }
              })
            );

            return { ...category, Type: typesWithSubCategories };
          } catch (error) {
            console.error(`Failed to fetch types for category ${category.id}:`, error);
            return { ...category, Type: [] };
          }
        })
      );

      // Sort categories by createdAt (oldest to newest)
      const sortedCategories = categoriesWithHierarchy.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setCategories(sortedCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const brandsResponse = await fetch(`${apiUrl}/api/brands`);
      if (!brandsResponse.ok) return;

      const brandsData = await brandsResponse.json();
      const brandsList = brandsData.brands || [];

      // Sort brands alphabetically by name
      const sortedBrands = brandsList.sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );

      setBrands(sortedBrands);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  // Instant search with debouncing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only search if query has at least 1 character
    if (searchQuery.trim().length >= 1) {
      setInstantLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchInstantResults(searchQuery);
      }, 300); // 300ms debounce
    } else {
      setInstantResults([]);
      setShowInstantResults(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Click outside to close instant results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setShowInstantResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInstantResults = async (query: string) => {
    if (!query.trim()) {
      setInstantResults([]);
      setInstantLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${apiUrl}/api/products?search=${encodeURIComponent(query)}&limit=8&sortBy=createdAt`
      );
      if (!response.ok) {
        setInstantResults([]);
        return;
      }
      const data = await response.json();
      setInstantResults(data.products || []);
      setShowInstantResults(true);
    } catch (error) {
      console.error('Error fetching instant results:', error);
      setInstantResults([]);
    } finally {
      setInstantLoading(false);
    }
  };

  const handleInstantResultClick = (product: Product) => {
    setShowInstantResults(false);
    setSearchQuery('');
    router.push(`/products/${product.slug}`);
  };

  const formatPrice = (price: number, salePrice: number | null) => {
    const displayPrice = salePrice || price;
    return `৳${displayPrice.toLocaleString()}`;
  };

  return (
    <>
      {/* Search Focus Overlay - Lower z-index than navbar */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-30 transition-opacity duration-200"
          onClick={() => setIsSearchFocused(false)}
        />
      )}

      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        {/* Top Banner */}
        {/* <div className="bg-linear-to-r from-red-500 to-purple-600 text-white text-center py-2 text-sm">
          <p>Free Shipping on orders over ৳500! 🎉</p>
        </div> */}

        {/* Main Navbar */}
        <div className="bg-red-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button - Left side on mobile */}
            <button
              aria-label='mobile menu'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white hover:text-gray-200 flex flex-col gap-1.5 w-6"
            >
              <span className="h-0.5 w-full bg-white rounded transition-all"></span>
              <span className="h-0.5 w-4 bg-white rounded transition-all"></span>
              <span className="h-0.5 w-5 bg-white rounded transition-all"></span>
            </button>

            {/* Logo - Centered on mobile, left on desktop */}
            <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center justify-center md:justify-start gap-4">
              <Link href="/" className="flex items-center justify-center md:justify-start">
                <Image
                  src="/Logo.png"
                  alt="Khali's Beauty"
                  width={1000}
                  height={250}
                  className="h-16 w-auto md:h-40"
                  priority
                />
              </Link>

              {/* Brands Dropdown - Desktop only */}
              <div
                ref={brandsButtonRef}
                className="hidden md:block relative"
                onMouseEnter={() => {
                  setIsBrandsHovered(true);
                  if (brandsButtonRef.current) {
                    const rect = brandsButtonRef.current.getBoundingClientRect();
                    setBrandsDropdownPosition({
                      top: rect.bottom,
                      left: rect.left
                    });
                  }
                }}
                onMouseLeave={() => setIsBrandsHovered(false)}
              >
                <Link
                  href="/products"
                  className="text-sm text-white hover:text-gray-200 transition-colors cursor-pointer px-2 py-1"
                >
                  BRANDS
                </Link>
              </div>
            </div>

            {/* Search Bar - Desktop - Centered */}
            <div className="hidden md:flex flex-1 justify-center items-center relative z-10">
              <div ref={searchContainerRef} className="w-full max-w-md relative">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchFocused(false);
                      setShowInstantResults(false);
                    }
                  }}
                  className="relative w-full"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      if (instantResults.length > 0) {
                        setShowInstantResults(true);
                      }
                    }}
                    placeholder="Search for products..."
                    className="w-full px-4 py-2 pl-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative bg-white transition-all"
                    autoComplete="off"
                  />
                  <button type="submit" aria-label="Search" className="absolute left-3 top-2.5">
                    <Search className="h-5 w-5 text-gray-400" />
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setInstantResults([]);
                        setShowInstantResults(false);
                      }}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </form>

                {/* Instant Search Results Dropdown */}
                {showInstantResults && searchQuery && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-[500px] overflow-y-auto">
                    {instantLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                      </div>
                    ) : instantResults.length > 0 ? (
                      <>
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm text-gray-600">
                            Top {instantResults.length} Results
                          </p>
                        </div>
                        <div className="py-2">
                          {instantResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleInstantResultClick(product)}
                              className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-4 transition-colors text-left"
                            >
                              {/* Product Image */}
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Search className="w-8 h-8" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm text-gray-900 truncate">
                                  {product.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-red-600">
                                    {formatPrice(product.price, product.salePrice)}
                                  </p>
                                  {product.salePrice && (
                                    <p className="text-xs text-gray-500 line-through">
                                      ৳{product.price.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                {product.Brand && (
                                  <p className="text-xs text-gray-500 mt-0.5">{product.Brand.name}</p>
                                )}
                              </div>

                              {/* Sales Badge */}
                              {product.totalSold !== undefined && product.totalSold > 0 && (
                                <div className="flex-shrink-0">
                                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                    {product.totalSold} sold
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setShowInstantResults(false);
                              setIsSearchFocused(false);
                              router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                            }}
                            className="w-full text-center text-sm text-red-600 hover:text-red-700"
                          >
                            View all results for &quot;{searchQuery}&quot;
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No products found for &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Wishlist Icon - Desktop only */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="hidden md:flex relative text-white hover:text-gray-200 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Icon - Desktop only */}
              <button
                onClick={openCart}
                className="hidden md:flex relative text-white hover:text-gray-200 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Menu - Hidden on mobile, shown on md and up */}
              <div className="relative hidden md:block">
                {user ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-1 text-white hover:text-gray-200 transition-colors"
                    >
                      <User className="h-6 w-6" />
                      <span className="text-sm hidden lg:inline">
                        {user.firstName || 'Account'}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-[60]">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          My Orders
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <hr className="my-2" />
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="flex items-center space-x-1 text-white hover:text-gray-200 transition-colors"
                    >
                      <User className="h-6 w-6" />
                      <span className="text-sm hidden lg:inline">Login</span>
                    </Link>
                    <Link
                      href="/signup"
                      className="hidden lg:inline text-sm text-white hover:text-gray-200 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div ref={mobileSearchContainerRef} className="md:hidden pb-4 relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setIsSearchFocused(false);
                  setShowInstantResults(false);
                }
              }}
              className="relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (instantResults.length > 0) {
                    setShowInstantResults(true);
                  }
                }}
                placeholder="Search for products..."
                className="w-full px-4 py-2 pl-10 pr-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative bg-white transition-all"
                autoComplete="off"
              />
              <button type="submit" aria-label="Search" className="absolute left-3 top-2.5">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setInstantResults([]);
                    setShowInstantResults(false);
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </form>

            {/* Instant Search Results Dropdown - Mobile */}
            {showInstantResults && searchQuery && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-[60] max-h-[500px] overflow-y-auto">
                {instantLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  </div>
                ) : instantResults.length > 0 ? (
                  <>
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Top {instantResults.length} Results
                      </p>
                    </div>
                    <div className="py-2">
                      {instantResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleInstantResultClick(product)}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-4 transition-colors text-left"
                        >
                          {/* Product Image */}
                          <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Search className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-red-600">
                                {formatPrice(product.price, product.salePrice)}
                              </p>
                              {product.salePrice && (
                                <p className="text-xs text-gray-500 line-through">
                                  ৳{product.price.toLocaleString()}
                                </p>
                              )}
                            </div>
                            {product.Brand && (
                              <p className="text-xs text-gray-500 mt-0.5">{product.Brand.name}</p>
                            )}
                          </div>

                          {/* Sales Badge */}
                          {product.totalSold !== undefined && product.totalSold > 0 && (
                            <div className="flex-shrink-0">
                              <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                {product.totalSold} sold
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowInstantResults(false);
                          setIsSearchFocused(false);
                          router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        }}
                        className="w-full text-center text-sm text-red-600 hover:text-red-700"
                      >
                        View all results for &quot;{searchQuery}&quot;
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No products found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Mobile Menu Sidebar */}
        <>
          {/* Overlay */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 transition-opacity duration-200 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`fixed top-0 left-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {/* User Profile Section - Only shown when logged in */}
              {user && (
                <div className="mb-4 pb-4 border-b-2 border-gray-300">
                  <div className="bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-4 mb-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-red-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-lg">
                        {user.firstName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>My Orders</span>
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Categories with expandable Types and SubCategories */}
              {categories
                .filter(category =>
                  category.name.toLowerCase() !== 'men' &&
                  category.name.toLowerCase() !== 'jewellery' &&
                  category.name.toLowerCase() !== 'jewelry'
                )
                .map((category) => (
                <div key={category.id} className="border-b border-gray-100 pb-2">
                  {/* Category Level */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/category/${category.slug}`}
                      className="flex-1 text-gray-700 hover:text-red-500 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                    {category.Type && category.Type.length > 0 && (
                      <button
                        onClick={() => setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id)}
                        className="p-2 text-gray-600 hover:text-red-500"
                        aria-label={expandedCategoryId === category.id ? "Collapse" : "Expand"}
                      >
                        {expandedCategoryId === category.id ? (
                          <Minus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Types Level - Show when category is expanded */}
                  {expandedCategoryId === category.id && category.Type && (
                    <div className="ml-4 mt-2 space-y-2">
                      {category.Type.map((type) => (
                        <div key={type.id}>
                          {/* Type Level */}
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/type/${type.slug}`}
                              className="flex-1 text-sm text-gray-600 hover:text-red-500 py-1.5"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {type.name}
                            </Link>
                            {type.SubCategory && type.SubCategory.length > 0 && (
                              <button
                                onClick={() => setExpandedTypeId(expandedTypeId === type.id ? null : type.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500"
                                aria-label={expandedTypeId === type.id ? "Collapse" : "Expand"}
                              >
                                {expandedTypeId === type.id ? (
                                  <Minus className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* SubCategories Level - Show when type is expanded */}
                          {expandedTypeId === type.id && type.SubCategory && (
                            <div className="ml-4 mt-1 space-y-1">
                              {type.SubCategory.map((subCat) => (
                                <Link
                                  key={subCat.id}
                                  href={`/subcategory/${subCat.slug}`}
                                  className="block text-xs text-gray-500 hover:text-red-500 py-1"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {subCat.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

{/*
              All Products Link
              <Link
                href="/products"
                className="block text-gray-700 hover:text-red-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link> */}

              {/* Men Category - Only show if it exists with expandable Types and SubCategories */}
              {(() => {
                const menCategory = categories.find(cat => cat.name.toLowerCase() === 'men');
                if (!menCategory) return null;

                return (
                  <div className="border-b border-gray-100 pb-2">
                    {/* Category Level */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/category/${menCategory.slug}`}
                        className="flex-1 text-gray-700 hover:text-red-500 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        MEN
                      </Link>
                      {menCategory.Type && menCategory.Type.length > 0 && (
                        <button
                          onClick={() => setExpandedCategoryId(expandedCategoryId === menCategory.id ? null : menCategory.id)}
                          className="p-2 text-gray-600 hover:text-red-500"
                          aria-label={expandedCategoryId === menCategory.id ? "Collapse" : "Expand"}
                        >
                          {expandedCategoryId === menCategory.id ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Types Level - Show when category is expanded */}
                    {expandedCategoryId === menCategory.id && menCategory.Type && (
                      <div className="ml-4 mt-2 space-y-2">
                        {menCategory.Type.map((type) => (
                          <div key={type.id}>
                            {/* Type Level */}
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/type/${type.slug}`}
                                className="flex-1 text-sm text-gray-600 hover:text-red-500 py-1.5"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {type.name}
                              </Link>
                              {type.SubCategory && type.SubCategory.length > 0 && (
                                <button
                                  onClick={() => setExpandedTypeId(expandedTypeId === type.id ? null : type.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-500"
                                  aria-label={expandedTypeId === type.id ? "Collapse" : "Expand"}
                                >
                                  {expandedTypeId === type.id ? (
                                    <Minus className="h-3.5 w-3.5" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* SubCategories Level - Show when type is expanded */}
                            {expandedTypeId === type.id && type.SubCategory && (
                              <div className="ml-4 mt-1 space-y-1">
                                {type.SubCategory.map((subCat) => (
                                  <Link
                                    key={subCat.id}
                                    href={`/subcategory/${subCat.slug}`}
                                    className="block text-xs text-gray-500 hover:text-red-500 py-1"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {subCat.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Jewellery Category - Only show if it exists with expandable Types and SubCategories */}
              {(() => {
                const jewelleryCategory = categories.find(cat => cat.name.toLowerCase() === 'jewellery' || cat.name.toLowerCase() === 'jewelry');
                if (!jewelleryCategory) return null;

                return (
                  <div className="border-b border-gray-100 pb-2">
                    {/* Category Level */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/category/${jewelleryCategory.slug}`}
                        className="flex-1 text-gray-700 hover:text-red-500 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        JEWELLERY
                      </Link>
                      {jewelleryCategory.Type && jewelleryCategory.Type.length > 0 && (
                        <button
                          onClick={() => setExpandedCategoryId(expandedCategoryId === jewelleryCategory.id ? null : jewelleryCategory.id)}
                          className="p-2 text-gray-600 hover:text-red-500"
                          aria-label={expandedCategoryId === jewelleryCategory.id ? "Collapse" : "Expand"}
                        >
                          {expandedCategoryId === jewelleryCategory.id ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Types Level - Show when category is expanded */}
                    {expandedCategoryId === jewelleryCategory.id && jewelleryCategory.Type && (
                      <div className="ml-4 mt-2 space-y-2">
                        {jewelleryCategory.Type.map((type) => (
                          <div key={type.id}>
                            {/* Type Level */}
                            <div className="flex items-center justify-between">
                              <Link
                                href={`/type/${type.slug}`}
                                className="flex-1 text-sm text-gray-600 hover:text-red-500 py-1.5"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {type.name}
                              </Link>
                              {type.SubCategory && type.SubCategory.length > 0 && (
                                <button
                                  onClick={() => setExpandedTypeId(expandedTypeId === type.id ? null : type.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-500"
                                  aria-label={expandedTypeId === type.id ? "Collapse" : "Expand"}
                                >
                                  {expandedTypeId === type.id ? (
                                    <Minus className="h-3.5 w-3.5" />
                                  ) : (
                                    <Plus className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* SubCategories Level - Show when type is expanded */}
                            {expandedTypeId === type.id && type.SubCategory && (
                              <div className="ml-4 mt-1 space-y-1">
                                {type.SubCategory.map((subCat) => (
                                  <Link
                                    key={subCat.id}
                                    href={`/subcategory/${subCat.slug}`}
                                    className="block text-xs text-gray-500 hover:text-red-500 py-1"
                                    onClick={() => setIsMenuOpen(false)}
                                  >
                                    {subCat.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Deals Link */}
              <Link
                href="/offers"
                className="block text-gray-700 hover:text-red-500 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                GIGA DEALS
              </Link>

              {/* Brands Link - At the end with cursive font */}
              <Link
                href="/brands"
                className="block text-gray-700 hover:text-red-500 py-2 italic"
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </Link>

              {/* Login/Signup Links for non-authenticated users */}
              {!user && (
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-red-500 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-gray-700 hover:text-red-500 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
              </div>
            </div>
          </div>
        </>

        {/* Categories Navigation - Desktop with Mega Menu */}
        <div className="hidden md:block border-t border-gray-200 bg-white relative">
          {/* Category Links Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2 min-h-12 py-2 relative z-50">
              {categories
                .filter(category =>
                  category.name.toLowerCase() !== 'men' &&
                  category.name.toLowerCase() !== 'jewellery' &&
                  category.name.toLowerCase() !== 'jewelry'
                )
                .slice(0, 7)
                .map((category) => (
                <div
                  key={category.id}
                  className="relative group"
                  onMouseEnter={() => !isSearchFocused && setHoveredCategoryId(category.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm text-gray-700 hover:text-red-500 transition-all duration-200 whitespace-nowrap flex items-center px-3 py-2 rounded-md hover:bg-red-50 relative"
                  >
                    {category.name}
                    {/* Active indicator */}
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 transform origin-left transition-transform duration-200 ${
                      hoveredCategoryId === category.id ? 'scale-x-100' : 'scale-x-0'
                    }`} />
                  </Link>
                </div>
              ))}
              {/* <Link
                href="/products"
                className="text-sm text-gray-700 hover:text-red-500 transition-all duration-200 whitespace-nowrap flex items-center px-3 py-2 rounded-md hover:bg-red-50"
              >
                All Products
              </Link> */}

              {/* Men Category - Only show if it exists */}
              {categories.find(cat => cat.name.toLowerCase() === 'men') && (
                <div
                  className="relative group"
                  onMouseEnter={() => !isSearchFocused && setHoveredCategoryId(categories.find(cat => cat.name.toLowerCase() === 'men')!.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                >
                  <Link
                    href={`/category/${categories.find(cat => cat.name.toLowerCase() === 'men')?.slug}`}
                    className="text-sm text-white bg-gray-600 hover:bg-gray-700 transition-all duration-200 whitespace-nowrap flex items-center px-4 py-2 rounded-full shadow-md font-medium"
                  >
                    MEN
                  </Link>
                </div>
              )}

              {/* Jewellery Category - Only show if it exists */}
              {categories.find(cat => cat.name.toLowerCase() === 'jewellery' || cat.name.toLowerCase() === 'jewelry') && (
                <div
                  className="relative group"
                  onMouseEnter={() => !isSearchFocused && setHoveredCategoryId(categories.find(cat => cat.name.toLowerCase() === 'jewellery' || cat.name.toLowerCase() === 'jewelry')!.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                >
                  <Link
                    href={`/category/${categories.find(cat => cat.name.toLowerCase() === 'jewellery' || cat.name.toLowerCase() === 'jewelry')?.slug}`}
                    className="text-sm text-white bg-yellow-600 hover:bg-yellow-700 transition-all duration-200 whitespace-nowrap flex items-center px-4 py-2 rounded-full shadow-md font-medium"
                  >
                    JEWELLERY
                  </Link>
                </div>
              )}

              <Link
                href="/offers"
                className="text-sm text-white bg-red-600 hover:bg-red-700 transition-all duration-200 whitespace-nowrap flex items-center px-4 py-2 rounded-full shadow-md font-medium"
              >
                GIGA DEALS
              </Link>
            </div>
          </div>

          {/* Mega Menu Dropdown - Single instance rendered outside */}
          {!isSearchFocused && hoveredCategoryId && categories.find(cat => cat.id === hoveredCategoryId)?.Type && categories.find(cat => cat.id === hoveredCategoryId)!.Type!.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 flex justify-center animate-fadeIn"
              onMouseEnter={() => setHoveredCategoryId(hoveredCategoryId)}
              onMouseLeave={() => setHoveredCategoryId(null)}
            >
              <div className="bg-white border border-gray-200 shadow-2xl rounded-b-lg mx-4 sm:mx-8 md:mx-16 w-full max-w-6xl overflow-hidden">
                <div className="px-6 py-6">
                  {/* Category Title */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-red-100">
                    <h3 className="text-lg text-gray-900">
                      {categories.find(cat => cat.id === hoveredCategoryId)?.name}
                    </h3>
                    <Link
                      href={`/category/${categories.find(cat => cat.id === hoveredCategoryId)?.slug}`}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
                    >
                      View All →
                    </Link>
                  </div>

                  {/* Types and SubCategories Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
                    {categories.find(cat => cat.id === hoveredCategoryId)?.Type?.map((type) => (
                      <div key={type.id} className="space-y-3 group/type">
                        <Link
                          href={`/type/${type.slug}`}
                          className="text-sm text-gray-900 hover:text-red-500 block uppercase tracking-wide transition-colors relative inline-block"
                        >
                          {type.name}
                          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover/type:w-full transition-all duration-200" />
                        </Link>
                        {type.SubCategory && type.SubCategory.length > 0 && (
                          <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                            {type.SubCategory.map((subCat) => (
                              <Link
                                key={subCat.id}
                                href={`/subcategory/${subCat.slug}`}
                                className="text-xs text-gray-600 hover:text-red-500 hover:translate-x-1 block transition-all duration-150 py-0.5"
                              >
                                • {subCat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop overlay for dropdown */}
        {!isSearchFocused && hoveredCategoryId && (
          <div
            className="fixed left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
            style={{ top: '113px' }}
            onMouseEnter={() => setHoveredCategoryId(null)}
          />
        )}
      </nav>

      {/* Brands Dropdown Menu - Rendered outside nav for proper z-index */}
      {isBrandsHovered && brands.length > 0 && (
        <div
          className="fixed w-64 bg-white border border-gray-200 shadow-2xl rounded-lg z-[999] max-h-96 overflow-y-auto"
          style={{
            top: `${brandsDropdownPosition.top}px`,
            left: `${brandsDropdownPosition.left}px`
          }}
          onMouseEnter={() => setIsBrandsHovered(true)}
          onMouseLeave={() => setIsBrandsHovered(false)}
        >
          <div className="py-2">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brandId=${brand.id}&brandName=${encodeURIComponent(brand.name)}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist Sidebar */}
      <WishlistSidebar
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={removeFromWishlist}
        onAddToCart={async (product) => {
          try {
            await addToCart(product.id, 1);
          } catch (error) {
            console.error('Error adding to cart:', error);
          }
        }}
      />

      {/* Fixed Cart and Wishlist Buttons - Right Side - Mobile Only */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-0 md:hidden">
        {/* Wishlist Button */}
        <button
          onClick={() => setIsWishlistOpen(true)}
          className="bg-white hover:bg-red-50 text-gray-700 hover:text-red-500 p-3 shadow-lg transition-all duration-200 relative group border-l border-b border-gray-200"
          aria-label="Wishlist"
        >
          <Heart className="h-5 w-5" />
          {wishlistCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
          <span className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Wishlist
          </span>
        </button>

        {/* Cart Button */}
        <button
          onClick={openCart}
          className="bg-white hover:bg-red-50 text-gray-700 hover:text-red-500 p-3 shadow-lg transition-all duration-200 relative group border-l border-t border-gray-200"
          aria-label="Cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Cart
          </span>
        </button>
      </div>
    </>
  );
}
