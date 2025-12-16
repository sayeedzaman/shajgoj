'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productsAPI, categoriesAPI, brandsAPI } from '@/src/lib/api';
import { Product, Category, Brand } from '@/src/types/index';
import ProductCard from '@/src/components/products/ProductCard';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
      performSearch(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [selectedCategory, selectedBrand, sortBy, sortOrder, currentPage, priceRange]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      const response = await productsAPI.getAll({
        search: query,
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: 24,
      });
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
      setTotalResults(response.pagination.totalProducts);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await brandsAPI.getAll();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch(searchQuery);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange([0, 10000]);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setProducts([]);
    setTotalResults(0);
    clearFilters();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, categories..."
              className="w-full px-6 py-4 pl-12 pr-12 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </form>

          {/* Search Results Info */}
          {searchQuery && !loading && (
            <p className="mt-4 text-gray-600">
              {totalResults > 0 ? (
                <>
                  Found <span className="font-semibold text-gray-900">{totalResults}</span> result
                  {totalResults !== 1 && 's'} for &quot;<span className="font-semibold text-gray-900">{searchQuery}</span>&quot;
                </>
              ) : (
                <>
                  No results found for &quot;<span className="font-semibold text-gray-900">{searchQuery}</span>&quot;
                </>
              )}
            </p>
          )}
        </div>

        {searchQuery && (
          <>
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 px-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Sidebar */}
              <aside
                className={`${
                  showFilters ? 'block' : 'hidden'
                } lg:block lg:w-64 flex-shrink-0`}
              >
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                    {(selectedCategory || selectedBrand || priceRange[0] > 0 || priceRange[1] < 10000) && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === ''}
                          onChange={() => setSelectedCategory('')}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">All Categories</span>
                      </label>
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === category.id}
                            onChange={() => setSelectedCategory(category.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="brand"
                          checked={selectedBrand === ''}
                          onChange={() => setSelectedBrand('')}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">All Brands</span>
                      </label>
                      {brands.map((brand) => (
                        <label key={brand.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="brand"
                            checked={selectedBrand === brand.id}
                            onChange={() => setSelectedBrand(brand.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>৳{priceRange[0]}</span>
                        <span>৳{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Search Results */}
              <main className="flex-1">
                {/* Sort Options */}
                {products.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <p className="text-sm text-gray-600">
                        Showing {products.length} of {totalResults} results
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-700 font-medium">Sort by:</label>
                        <select
                          value={`${sortBy}-${sortOrder}`}
                          onChange={(e) => {
                            const [sort, order] = e.target.value.split('-');
                            setSortBy(sort as 'createdAt' | 'price' | 'name');
                            setSortOrder(order as 'asc' | 'desc');
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="createdAt-desc">Newest First</option>
                          <option value="createdAt-asc">Oldest First</option>
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="name-asc">Name: A to Z</option>
                          <option value="name-desc">Name: Z to A</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg border border-gray-200 animate-pulse"
                      >
                        <div className="aspect-square bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          showAddToCart={true}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex gap-1">
                          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : searchQuery ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No products found</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Try different keywords or adjust your filters
                    </p>
                    {(selectedCategory || selectedBrand || priceRange[0] > 0 || priceRange[1] < 10000) && (
                      <button
                        onClick={clearFilters}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : null}
              </main>
            </div>
          </>
        )}

        {/* Empty State */}
        {!searchQuery && !loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center max-w-2xl mx-auto">
            <SearchIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Searching</h2>
            <p className="text-gray-600 mb-6">
              Enter a product name, brand, or category to find what you're looking for
            </p>
            <Link
              href="/products"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
