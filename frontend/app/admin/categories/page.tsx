'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { adminCategoriesAPI } from '@/src/lib/adminApi';
import type { Category } from '@/src/types/index';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminCategoriesAPI.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', image: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await adminCategoriesAPI.update(editingCategory.id, formData);
      } else {
        await adminCategoriesAPI.create(formData);
      }
      fetchCategories();
      handleCloseModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await adminCategoriesAPI.delete(id);
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-rose-300">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mb-4">Slug: {category.slug}</p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>

              <div>
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
                  placeholder="category-slug"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg hover:from-rose-600 hover:to-pink-700 transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
