'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productsAPI, categoriesAPI, brandsAPI } from '@/src/lib/api';
import { Product, Category, Brand } from '@/src/types/index';
import ProductCard from '@/src/components/products/ProductCard';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (slug) {
      fetchCategory();
      fetchBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, selectedBrand, sortBy, sortOrder, currentPage, priceRange]);

  const fetchCategory = async () => {
    try {
      const categories = await categoriesAPI.getAll();
      const foundCategory = categories.find((cat) => cat.slug === slug);
      setCategory(foundCategory || null);
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('No categories available to show');
    }
  };

  const fetchProducts = async () => {
    if (!category) return;

    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getAll({
        categoryId: category.id,
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
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('No products available to show');
      setProducts([]);
    } finally {
      setLoading(false);
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

  const clearFilters = () => {
    setSelectedBrand('');
    setPriceRange([0, 1000000]);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  if (!category && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header with Image */}
      {category?.image && (
        <div className="relative h-48 md:h-64 bg-linear-to-r from-red-100 to-purple-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-lg opacity-90">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/products" className="hover:text-red-600">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{category?.name}</span>
        </nav>

        {/* Category Title (if no image) */}
        {!category?.image && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name}</h1>
            {category?.description && (
              <p className="text-gray-600">{category.description}</p>
            )}
          </div>
        )}

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
            } lg:block lg:w-64 shrink-0`}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {(selectedBrand || priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-y-auto p-6 pt-4 space-y-6">
                {/* Brand Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
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
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-4">
                    {/* Input Fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Min</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
                          <input
                            type="number"
                            min="0"
                            max={priceRange[1]}
                            step="100"
                            value={priceRange[0]}
                            onChange={(e) => {
                              const newMin = Math.max(0, Math.min(parseInt(e.target.value) || 0, priceRange[1]));
                              setPriceRange([newMin, priceRange[1]]);
                            }}
                            className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Max</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
                          <input
                            type="number"
                            min={priceRange[0]}
                            max="1000000"
                            step="100"
                            value={priceRange[1]}
                            onChange={(e) => {
                              const newMax = Math.max(priceRange[0], Math.min(parseInt(e.target.value) || 1000000, 1000000));
                              setPriceRange([priceRange[0], newMax]);
                            }}
                            className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <div className="relative h-2">
                      <div className="absolute w-full h-2 bg-gray-200 rounded-lg" />
                      <div
                        className="absolute h-2 bg-red-600 rounded-lg"
                        style={{
                          left: `${(priceRange[0] / 1000000) * 100}%`,
                          right: `${100 - (priceRange[1] / 1000000) * 100}%`
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="1000"
                        value={priceRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          setPriceRange([Math.min(newMin, priceRange[1]), priceRange[1]]);
                        }}
                        className="absolute top-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                        style={{ height: '8px' }}
                        aria-label="Minimum price"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="1000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          setPriceRange([priceRange[0], Math.max(newMax, priceRange[0])]);
                        }}
                        className="absolute top-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-red-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                        style={{ height: '8px' }}
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Sort Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${products.length} products found`}
                </p>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 font-medium">Sort by:</label>
                  <select
                    aria-label="Sort products"
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

            {/* Products Grid */}
            {error ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : loading ? (
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
                      {(() => {
                        const maxPagesToShow = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                        if (endPage - startPage < maxPagesToShow - 1) {
                          startPage = Math.max(1, endPage - maxPagesToShow + 1);
                        }

                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }

                        return pages.map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                              currentPage === pageNum
                                ? 'bg-red-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ));
                      })()}
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
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg mb-2">No products found</p>
                <p className="text-gray-400 text-sm mb-4">
                  Try adjusting your filters
                </p>
                <button
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
