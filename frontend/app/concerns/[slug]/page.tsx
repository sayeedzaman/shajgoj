'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { concernsAPI, brandsAPI } from '@/src/lib/api';
import { Product, Concern, Brand } from '@/src/types/index';
import ProductCard from '@/src/components/products/ProductCard';
import PriceRangeFilter from '@/src/components/filters/PriceRangeFilter';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';

export default function ConcernPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [concern, setConcern] = useState<Concern | null>(null);
  const [allConcerns, setAllConcerns] = useState<Concern[]>([]);
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
      fetchConcern();
      fetchAllConcerns();
      fetchBrands();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (concern) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concern, selectedBrand, sortBy, sortOrder, currentPage, priceRange]);

  const fetchConcern = async () => {
    try {
      const concerns = await concernsAPI.getAll();
      const foundConcern = concerns.find((c) => c.slug === slug);
      setConcern(foundConcern || null);
    } catch (error) {
      console.error('Error fetching concern:', error);
      setError('Concern not found');
    }
  };

  const fetchAllConcerns = async () => {
    try {
      const data = await concernsAPI.getAll();
      setAllConcerns(data);
    } catch (error) {
      console.error('Error fetching all concerns:', error);
    }
  };

  const fetchProducts = async () => {
    if (!concern) return;

    try {
      setLoading(true);
      setError(null);
      const response = await concernsAPI.searchProducts(concern.id, {
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

  if (!concern && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Concern not found</h1>
          <Link href="/shop-by-concern" className="text-pink-600 hover:text-pink-700 font-medium">
            Browse all concerns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-pink-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/shop-by-concern" className="hover:text-pink-600">Shop by Concern</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{concern?.name}</span>
        </nav>

        {/* Concern Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{concern?.name}</h1>
          <p className="text-gray-600">
            Products specially curated for {concern?.name.toLowerCase()}
          </p>
        </div>

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
                    className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="overflow-y-auto p-6 pt-4 space-y-6">
                {/* Concerns */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Concerns</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {allConcerns.map((c) => (
                      <label key={c.id} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="concern"
                          checked={c.id === concern?.id}
                          onChange={() => router.push(`/concerns/${c.slug}`)}
                          className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
                        className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
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
                          className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>


                <PriceRangeFilter
                  value={priceRange}
                  onChange={(range) => {
                    setPriceRange(range);
                    setCurrentPage(1);
                  }}
                />
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
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
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
                                ? 'bg-pink-600 text-white'
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
                <p className="text-gray-500 text-lg mb-2">No products in stock</p>
                <p className="text-gray-400 text-sm mb-4">
                  Try adjusting your filters or check back later
                </p>
                <button
                  onClick={clearFilters}
                  className="text-pink-600 hover:text-pink-700 font-medium text-sm"
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
