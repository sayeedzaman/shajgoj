'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { adminProductsAPI, adminCategoriesAPI, adminBrandsAPI } from '@/src/lib/adminApi';
import type { Category, Brand } from '@/src/types/index';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '',
    categoryId: '',
    brandId: '',
    images: [] as string[],
    featured: false,
  });

  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    fetchCategoriesAndBrands();
  }, []);

  const fetchCategoriesAndBrands = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        adminCategoriesAPI.getAll(),
        adminBrandsAPI.getAll(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Auto-generate slug from name
      if (name === 'name') {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        setFormData((prev) => ({ ...prev, slug }));
      }
    }
  };

  const addImage = () => {
    if (imageInput && !formData.images.includes(imageInput)) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput],
      }));
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.slug || !formData.price || !formData.categoryId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const productData: any = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        categoryId: formData.categoryId,
        brandId: formData.brandId || undefined,
        images: formData.images,
        featured: formData.featured,
      };

      await adminProductsAPI.create(productData);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Create a new product in your inventory</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="product-slug"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from product name</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price
              </label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Category & Brand */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Select Brand (Optional)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter image URL"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Options</h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Mark as Featured Product
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
