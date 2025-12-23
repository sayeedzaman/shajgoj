'use client';

import { useState, useEffect } from 'react';
import { Tag, Filter, ChevronDown, Sparkles } from 'lucide-react';
import SquareProductCard from '@/src/components/products/SquareProductCard';
import type { Product } from '@/src/types';

// NOTE: Backend API for products on sale is not yet implemented
// Required endpoint: GET /api/products/on-sale?page=1&limit=20&category=&sortBy=discount

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'discount' | 'price' | 'name'>('discount');

  const productsPerPage = 20;

  useEffect(() => {
    fetchSaleProducts();
  }, [currentPage, selectedCategory, sortBy]);

  const fetchSaleProducts = async () => {
    try {
      setLoading(true);

      let allProducts: Product[] = [];

      // Try to fetch from backend API first
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(
          `${apiUrl}/api/products/on-sale?page=${currentPage}&limit=${productsPerPage}&category=${selectedCategory !== 'all' ? selectedCategory : ''}&sortBy=${sortBy}`
        );

        if (response.ok) {
          const data = await response.json();
          allProducts = data.products;
          setTotalPages(data.pages || 1);
        } else {
          throw new Error('Backend API not available');
        }
      } catch (apiError) {
        console.log('Backend API not available, checking localStorage...');

        // Fallback: Try to fetch from localStorage (admin products)
        const savedProducts = localStorage.getItem('admin_products');
        if (savedProducts) {
          const parsedProducts: Product[] = JSON.parse(savedProducts);
          // Filter products that have salePrice and it's less than regular price
          allProducts = parsedProducts.filter(
            (p) => p.salePrice !== null && p.salePrice > 0 && p.salePrice < p.price
          );
        }

        // If still no products, use minimal mock data for demonstration
        if (allProducts.length === 0) {
          console.log('No products on sale found. Using demo data...');
          allProducts = Array.from({ length: 12 }, (_, i) => ({
            id: `sale-${i + 1}`,
            name: `Product on Sale ${i + 1}`,
            slug: `product-sale-${i + 1}`,
            description: 'Amazing product with great discount!',
            price: 1000 + i * 100,
            salePrice: 700 + i * 50,
            stock: 25,
            images: [`https://placehold.co/400x400/f87171/white?text=Sale+${i + 1}`],
            imageUrl: null,
            featured: i % 3 === 0,
            categoryId: 'cat-1',
            Category: {
              id: 'cat-1',
              name: 'Beauty',
              slug: 'beauty',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            brandId: i % 2 === 0 ? 'brand-1' : null,
            Brand: i % 2 === 0 ? {
              id: 'brand-1',
              name: 'Popular Brand',
              slug: 'popular-brand',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
      }

      // Apply client-side filtering if using localStorage
      if (selectedCategory !== 'all') {
        allProducts = allProducts.filter(
          (p) => p.Category.slug.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      // Apply client-side sorting
      allProducts.sort((a, b) => {
        if (sortBy === 'discount') {
          const discountA = a.salePrice ? ((a.price - a.salePrice) / a.price) * 100 : 0;
          const discountB = b.salePrice ? ((b.price - b.salePrice) / b.price) * 100 : 0;
          return discountB - discountA; // Highest discount first
        } else if (sortBy === 'price') {
          const priceA = a.salePrice || a.price;
          const priceB = b.salePrice || b.price;
          return priceA - priceB; // Lowest price first
        } else {
          return a.name.localeCompare(b.name); // A-Z
        }
      });

      // Apply client-side pagination if not from backend
      const startIndex = (currentPage - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      const calculatedPages = Math.ceil(allProducts.length / productsPerPage);

      setProducts(paginatedProducts);
      setTotalPages(calculatedPages || 1);
    } catch (error) {
      console.error('Error fetching sale products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    avgDiscount: products.reduce((sum, p) => {
      if (p.salePrice && p.salePrice < p.price) {
        return sum + Math.round(((p.price - p.salePrice) / p.price) * 100);
      }
      return sum;
    }, 0) / (products.length || 1),
    maxSavings: Math.max(...products.map(p => p.salePrice ? p.price - p.salePrice : 0)),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Limited Time Offers</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Mega Sale!
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-white/90">
              Up to {Math.round(stats.avgDiscount)}% OFF on Selected Items
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                <div className="text-3xl font-bold">{stats.totalProducts}+</div>
                <div className="text-white/80">Products on Sale</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                <div className="text-3xl font-bold">৳{stats.maxSavings}</div>
                <div className="text-white/80">Max Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{products.length}</span> products
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              {/* Category Filter */}
              <div className="relative flex-1 md:flex-initial">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="makeup">Makeup</option>
                  <option value="skincare">Skincare</option>
                  <option value="haircare">Hair Care</option>
                  <option value="fragrance">Fragrance</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort Filter */}
              <div className="relative flex-1 md:flex-initial">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'discount' | 'price' | 'name');
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-sm"
                >
                  <option value="discount">Highest Discount</option>
                  <option value="price">Lowest Price</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading amazing deals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Tag className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products on sale</h3>
            <p className="text-gray-600">Check back soon for amazing deals!</p>
          </div>
        ) : (
          <>
            {/* Backend API Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Note:</strong> Backend API not yet implemented. Currently showing mock data.
                <br />
                <span className="text-xs">Required endpoint: GET /api/products/on-sale</span>
              </p>
            </div>

            {/* Square Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <SquareProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === i + 1
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </section>
      )}

      {/* Sale Banner */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't Miss Out!
          </h2>
          <p className="text-lg md:text-xl mb-6 text-white/90">
            These amazing deals won't last forever. Shop now and save big!
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-xl"
          >
            Back to Top
          </button>
        </div>
      </section>
    </div>
  );
}
