'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/AuthContext';
import { useCart } from '@/src/lib/CartContext';
import { useWishlist } from '@/src/lib/WishlistContext';
import { ShoppingCart, User, Search, Menu, Heart, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Category } from '@/src/types';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  return (
    <>
      {/* Search Focus Overlay */}
      {isSearchFocused && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 transition-opacity duration-200"
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
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-extrabold tracking-[0.3em] font-[Oswald]">SHAJGOJ</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
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
                  className="w-full px-4 py-2 pl-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative z-50 bg-white transition-all"
                />
                <button type="submit" aria-label="Search" className="absolute left-3 top-2.5 z-50">
                  <Search className="h-5 w-5 text-gray-400" />
                </button>
              </form>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-6">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden sm:flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors relative"
              >
                <Heart className="h-6 w-6" />
                <span className="text-sm">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors relative"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="text-sm hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <User className="h-6 w-6" />
                      <span className="text-sm hidden sm:inline">
                        {user.firstName || 'Account'}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
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
                      <span className="text-sm hidden sm:inline">Login</span>
                    </Link>
                    <Link
                      href="/signup"
                      className="hidden sm:inline text-sm text-gray-700 hover:text-red-500 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                aria-label='mobile menu'
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-gray-700 hover:text-red-500"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
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
                className="w-full px-4 py-2 pl-10 border-2 border-red-500 rounded-full focus:outline-none focus:border-green-500 relative z-50 bg-white transition-all"
              />
              <button type="submit" aria-label="Search" className="absolute left-3 top-2.5 z-50">
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="block text-gray-700 hover:text-red-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="block text-gray-700 hover:text-red-500"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-red-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-gray-700 hover:text-red-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Categories Navigation - Desktop */}
        <div className="hidden md:block border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-8 h-12 overflow-x-auto">
              {categories.slice(0, 7).map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors whitespace-nowrap"
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 hover:text-red-500 transition-colors whitespace-nowrap"
              >
                All Products
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
