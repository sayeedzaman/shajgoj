'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { useWishlist } from '@/src/lib/WishlistContext';
import { ShoppingCart, User, Search, Menu, Heart, LogOut, Plus, Minus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [categories, setCategories] = useState<CategoryWithHierarchy[]>([]);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);

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
                  const subCategoriesResponse = await fetch(`${apiUrl}/api/subcategories?typeId=${type.id}`);
                  if (!subCategoriesResponse.ok) return { ...type, SubCategory: [] };

                  const subCategoriesData = await subCategoriesResponse.json();
                  return { ...type, SubCategory: subCategoriesData.subCategories || [] };
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

      setCategories(categoriesWithHierarchy);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button - Left side on mobile */}
            <button
              aria-label='mobile menu'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-red-500"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo - Centered on mobile, left on desktop */}
            <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center justify-center md:justify-start">
              <Link href="/" className="flex items-center justify-center md:justify-start">
                <Image
                  src="/Logo.png"
                  alt="Khali's Beauty"
                  width={1000}
                  height={250}
                  className="h-16 w-auto md:h-25"
                  priority
                />
              </Link>
            </div>

            {/* Search Bar - Desktop - Centered */}
            <div className="hidden md:flex flex-1 justify-center items-center relative z-10">
              <div className="w-full max-w-md relative">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchFocused(false);
                    }
                  }}
                  className="relative w-full"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search for products..."
                    className="w-full px-4 py-2 pl-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative bg-white transition-all"
                  />
                  <button type="submit" aria-label="Search" className="absolute left-3 top-2.5">
                    <Search className="h-5 w-5 text-gray-400" />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Wishlist Icon - Desktop only */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="hidden md:flex relative text-gray-700 hover:text-red-500 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Icon - Desktop only */}
              <button
                onClick={openCart}
                className="hidden md:flex relative text-gray-700 hover:text-red-500 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors"
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
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <User className="h-6 w-6" />
                      <span className="text-sm hidden lg:inline">Login</span>
                    </Link>
                    <Link
                      href="/signup"
                      className="hidden lg:inline text-sm text-gray-700 hover:text-red-500 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4 relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setIsSearchFocused(false);
                }
              }}
              className="relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search for products..."
                className="w-full px-4 py-2 pl-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative bg-white transition-all"
              />
              <button type="submit" aria-label="Search" className="absolute left-3 top-2.5">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </form>
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
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
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
                      <div className="bg-red-500 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                        {user.firstName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
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
                      <span className="font-medium">My Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="font-medium">My Orders</span>
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Admin Dashboard</span>
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
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Categories with expandable Types and SubCategories */}
              {categories.map((category) => (
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

              {/* Brands Link */}
              <Link
                href="/brands"
                className="block text-gray-700 hover:text-red-500 py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </Link>

              {/* All Products Link */}
              <Link
                href="/products"
                className="block text-gray-700 hover:text-red-500 py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
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
            <div className="flex items-center justify-center space-x-8 h-12 relative z-50">
              {categories.slice(0, 7).map((category) => (
                <div
                  key={category.id}
                  className="h-full relative"
                  onMouseEnter={() => setHoveredCategoryId(category.id)}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors whitespace-nowrap h-full flex items-center px-2"
                  >
                    {category.name}
                  </Link>
                </div>
              ))}
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors whitespace-nowrap h-full flex items-center px-2"
              >
                All Products
              </Link>
            </div>
          </div>

          {/* Mega Menu Dropdown - Single instance rendered outside */}
          {hoveredCategoryId && categories.find(cat => cat.id === hoveredCategoryId)?.Type && categories.find(cat => cat.id === hoveredCategoryId)!.Type!.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-50 flex justify-center"
              onMouseEnter={() => setHoveredCategoryId(hoveredCategoryId)}
              onMouseLeave={() => setHoveredCategoryId(null)}
            >
              <div className="bg-white border border-gray-200 shadow-2xl rounded-b-lg mx-16 w-full max-w-6xl">
                <div className="px-6 py-6">
                  {/* Category Title */}
                  <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {categories.find(cat => cat.id === hoveredCategoryId)?.name}
                  </h3>

                  {/* Types and SubCategories Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categories.find(cat => cat.id === hoveredCategoryId)?.Type?.map((type) => (
                      <div key={type.id} className="space-y-2">
                        <Link
                          href={`/type/${type.slug}`}
                          className="text-xs font-semibold text-gray-900 hover:text-red-500 block uppercase tracking-wide transition-colors"
                        >
                          {type.name}
                        </Link>
                        {type.SubCategory && type.SubCategory.length > 0 && (
                          <div className="space-y-1.5">
                            {type.SubCategory.map((subCat) => (
                              <Link
                                key={subCat.id}
                                href={`/subcategory/${subCat.slug}`}
                                className="text-xs text-gray-600 hover:text-red-500 hover:underline block transition-colors"
                              >
                                {subCat.name}
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
        {hoveredCategoryId && (
          <div
            className="fixed left-0 right-0 bottom-0 bg-black/20 z-40"
            style={{ top: '113px' }}
          />
        )}
      </nav>

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
