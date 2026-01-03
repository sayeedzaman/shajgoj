'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsAPI, categoriesAPI, brandsAPI, typesAPI, subCategoriesAPI } from '@/src/lib/api';
import { Product, Category, Brand, Type, SubCategory } from '@/src/types/index';
import ProductCard from '@/src/components/products/ProductCard';
import EmptyState from '@/src/components/common/EmptyState';
import { Filter, SlidersHorizontal } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Check if we should filter by featured products from URL
  const isFeaturedFilter = searchParams.get('featured') === 'true';

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getAll({
        categoryId: selectedCategory || undefined,
        typeId: selectedType || undefined,
        subCategoryId: selectedSubCategory || undefined,
        brandId: selectedBrand || undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit: itemsPerPage,
        featured: isFeaturedFilter || undefined,
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
  }, [selectedCategory, selectedType, selectedSubCategory, selectedBrand, sortBy, sortOrder, currentPage, priceRange, itemsPerPage, isFeaturedFilter]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch types when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchTypesByCategory(selectedCategory);
    } else {
      setTypes([]);
      setSubCategories([]);
      setSelectedType('');
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  // Fetch subcategories when type changes
  useEffect(() => {
    if (selectedType) {
      fetchSubCategoriesByType(selectedType);
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedType]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTypesByCategory = async (categoryId: string) => {
    try {
      const data = await typesAPI.getByCategoryId(categoryId);
      setTypes(data);
    } catch (error) {
      console.error('Error fetching types:', error);
      setTypes([]);
    }
  };

  const fetchSubCategoriesByType = async (typeId: string) => {
    try {
      const data = await subCategoriesAPI.getByTypeId(typeId);
      setSubCategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
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
    setSelectedCategory('');
    setSelectedType('');
    setSelectedSubCategory('');
    setSelectedBrand('');
    setPriceRange([0, 1000000]);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isFeaturedFilter ? 'Featured Products' : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {isFeaturedFilter
              ? 'Discover our handpicked selection of featured beauty products'
              : 'Discover our complete collection of beauty products'}
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
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                {(selectedCategory || selectedType || selectedSubCategory || selectedBrand || priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="overflow-y-auto p-6 pt-4 space-y-6">
                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === ''}
                        onChange={() => {
                          setSelectedCategory('');
                          setSelectedType('');
                          setSelectedSubCategory('');
                        }}
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
                          onChange={() => {
                            setSelectedCategory(category.id);
                            setSelectedType('');
                            setSelectedSubCategory('');
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                {types.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Type</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          checked={selectedType === ''}
                          onChange={() => {
                            setSelectedType('');
                            setSelectedSubCategory('');
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">All Types</span>
                      </label>
                      {types.map((type) => (
                        <label key={type.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="type"
                            checked={selectedType === type.id}
                            onChange={() => {
                              setSelectedType(type.id);
                              setSelectedSubCategory('');
                            }}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* SubCategory Filter */}
                {subCategories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">SubCategory</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="subcategory"
                          checked={selectedSubCategory === ''}
                          onChange={() => setSelectedSubCategory('')}
                          className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">All SubCategories</span>
                      </label>
                      {subCategories.map((subCategory) => (
                        <label key={subCategory.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="subcategory"
                            checked={selectedSubCategory === subCategory.id}
                            onChange={() => setSelectedSubCategory(subCategory.id)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{subCategory.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

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
            {/* Sort and View Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {products.length} products
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 font-medium">Per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="items per page"
                    >
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 font-medium">Sort by:</label>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [sort, order] = e.target.value.split('-');
                        setSortBy(sort as 'createdAt' | 'price' | 'name');
                        setSortOrder(order as 'asc' | 'desc');
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="sort by"
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
              <EmptyState
                title="No Products Found"
                message="We couldn't find any products matching your filters. Try adjusting your search criteria."
                actionLabel="Clear Filters"
                actionHref="#"
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
