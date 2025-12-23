'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Filter, ChevronDown, X, Upload, Image as ImageIcon } from 'lucide-react';
import { adminAPI, type CreateProductRequest } from '@/src/lib/adminApi';
import { useAuth } from '@/src/lib/AuthContext';
import type { Product, Category, Brand } from '@/src/types';

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    salePrice: undefined,
    stock: 0,
    images: [],
    featured: false,
    categoryId: '',
    brandId: '',
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(['', '', '']);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user?.role === 'ADMIN') {
      fetchProducts();
    }
    // Public endpoints; fine to call regardless
    fetchCategories();
    fetchBrands();
  }, [authLoading, user, currentPage, searchQuery, categoryFilter, brandFilter]);

  const fetchProducts = async () => {
    if (authLoading || !user || user.role !== 'ADMIN') {
      // Wait until auth is ready and user is admin
      return;
    }
    try {
      setLoading(true);
      const response = await adminAPI.products.getAll({
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
      });
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch products';
      showError(message);
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await adminAPI.categories.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const brandsList = await adminAPI.brands.getAll();
      setBrands(brandsList);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for later upload
      const newFiles = [...imageFiles];
      newFiles[index] = file;
      setImageFiles(newFiles);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const newPreviews = [...imagePreviews];
        newPreviews[index] = result;
        setImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (index: number, url: string) => {
    const newPreviews = [...imagePreviews];
    newPreviews[index] = url;
    setImagePreviews(newPreviews);

    const newImages = [...(formData.images || [])];
    newImages[index] = url;
    setFormData({ ...formData, images: newImages.filter(img => img) });
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    newPreviews[index] = '';
    setImagePreviews(newPreviews);

    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages.filter(img => img) });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price,
        salePrice: product.salePrice || undefined,
        stock: product.stock,
        images: product.images || [],
        featured: product.featured,
        categoryId: product.categoryId,
        brandId: product.brandId || '',
      });
      setImagePreviews([
        product.images?.[0] || '',
        product.images?.[1] || '',
        product.images?.[2] || '',
      ]);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: 0,
        salePrice: undefined,
        stock: 0,
        images: [],
        featured: false,
        categoryId: '',
        brandId: '',
      });
      setImagePreviews(['', '', '']);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      salePrice: undefined,
      stock: 0,
      images: [],
      featured: false,
      categoryId: '',
      brandId: '',
    });
    setImagePreviews(['', '', '']);
    setImageFiles([null, null, null]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.slug || !formData.price || !formData.categoryId) {
      showError('Please fill all required fields (name, slug, price, category)');
      console.error('Missing required fields:', {
        name: formData.name,
        slug: formData.slug,
        price: formData.price,
        categoryId: formData.categoryId
      });
      return;
    }

    // Validate price is a positive number
    if (formData.price <= 0) {
      showError('Price must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      // Upload images to Cloudinary first if there are any files
      let uploadedImageUrls: string[] = [];
      const filesToUpload = imageFiles.filter((f): f is File => f !== null);

      if (filesToUpload.length > 0) {
        try {
          setUploadingImages(true);
          const uploadResult = await adminAPI.upload.uploadProductImages(filesToUpload);
          uploadedImageUrls = uploadResult.urls;
          console.log('Uploaded images to Cloudinary:', uploadedImageUrls);
        } catch (error) {
          console.error('Image upload error:', error);
          showError('Failed to upload images. Please try again.');
          setUploadingImages(false);
          setSubmitting(false);
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Also include any manually entered URLs (from the URL input field)
      const manualUrls = imagePreviews
        .filter((url, i) => url && !url.startsWith('data:image') && !imageFiles[i]);

      const allImageUrls = [...uploadedImageUrls, ...manualUrls].filter(url => url);

      // Clean the data - remove undefined/null optional fields and convert to proper types
      const cleanedData: CreateProductRequest = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description?.trim() || undefined,
        price: Number(formData.price),
        stock: formData.stock ? Number(formData.stock) : 0,
        images: allImageUrls,
        featured: formData.featured || false,
        categoryId: formData.categoryId.trim(),
      };

      // Only add optional fields if they have values
      if (formData.salePrice && formData.salePrice > 0 && formData.salePrice < formData.price) {
        cleanedData.salePrice = Number(formData.salePrice);
      }

      if (formData.brandId && formData.brandId.trim()) {
        cleanedData.brandId = formData.brandId.trim();
      }

      console.log('Submitting product:', cleanedData);

      if (editingProduct) {
        const result = await adminAPI.products.update(editingProduct.id, cleanedData);
        console.log('Update result:', result);
        showSuccess('Product updated successfully');
      } else {
        const result = await adminAPI.products.create(cleanedData);
        console.log('Create result:', result);
        showSuccess('Product created successfully');
      }
      closeModal();
      fetchProducts();
    } catch (error: unknown) {
      console.error('Submit error:', error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await adminAPI.products.delete(id);
        showSuccess('Product deleted successfully');
        fetchProducts();
      } catch (error: unknown) {
        if (error instanceof Error) {
          showError(error.message);
        } else {
          showError('Failed to delete product');
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-red-600" />
            Product Management
          </h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-gray-600 mt-4">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.Category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.Brand?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-red-600">
                            ৳{product.salePrice || product.price}
                          </span>
                          {product.salePrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ৳{product.price}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.featured
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.featured ? 'Featured' : 'Regular'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Product Images - 3 images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Product Images (Up to 3)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden group">
                        {imagePreviews[index] ? (
                          <>
                            <img
                              src={imagePreviews[index]}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-xs">Image {index + 1}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-xs">Upload</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(index, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste image URL"
                        value={imagePreviews[index]}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regular Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formData.salePrice && formData.price && formData.salePrice >= formData.price
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-red-500'
                    }`}
                  />
                  {formData.salePrice && formData.price && formData.salePrice >= formData.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>Sale price must be less than regular price (৳{formData.price})</span>
                    </p>
                  )}
                  {!formData.salePrice && (
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: Leave empty if no discount
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">No Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Featured Product
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImages || (formData.salePrice !== undefined && formData.price > 0 && formData.salePrice >= formData.price)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(submitting || uploadingImages) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {uploadingImages ? 'Uploading images...' : (submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product'))}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
