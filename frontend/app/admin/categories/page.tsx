'use client';

import { useState, useEffect } from 'react';
import { FolderTree, Plus, Search, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { adminAPI } from '@/src/lib/adminApi';
import type { Category } from '@/src/types';

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image2?: string;
  image3?: string;
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image: '',
    image2: '',
    image3: '',
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(['', '', '']);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const cats = await adminAPI.categories.getAll();
      setCategories(cats);
    } catch (error) {
      showError('Failed to fetch categories');
      console.error(error);
    } finally {
      setLoading(false);
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

      // Create preview for display only
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

    if (index === 0) {
      setFormData({ ...formData, image: url });
    } else if (index === 1) {
      setFormData({ ...formData, image2: url });
    } else {
      setFormData({ ...formData, image3: url });
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    newPreviews[index] = '';
    setImagePreviews(newPreviews);

    if (index === 0) {
      setFormData({ ...formData, image: '' });
    } else if (index === 1) {
      setFormData({ ...formData, image2: '' });
    } else {
      setFormData({ ...formData, image3: '' });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image: category.image || '',
        image2: category.image2 || '',
        image3: category.image3 || '',
      });
      setImagePreviews([
        category.image || '',
        category.image2 || '',
        category.image3 || '',
      ]);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        image2: '',
        image3: '',
      });
      setImagePreviews(['', '', '']);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      image2: '',
      image3: '',
    });
    setImagePreviews(['', '', '']);
    setImageFiles([null, null, null]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      showError('Please enter category name');
      return;
    }

    try {
      setSubmitting(true);

      // Upload images to Cloudinary first if there are any files
      let uploadedImageUrls: { image?: string; image2?: string; image3?: string } = {};
      const hasFilesToUpload = imageFiles.some((f) => f !== null);

      if (hasFilesToUpload) {
        try {
          setUploadingImages(true);
          const files: { image?: File; image2?: File; image3?: File } = {};
          if (imageFiles[0]) files.image = imageFiles[0];
          if (imageFiles[1]) files.image2 = imageFiles[1];
          if (imageFiles[2]) files.image3 = imageFiles[2];

          const uploadResult = await adminAPI.upload.uploadCategoryImages(files);
          uploadedImageUrls = uploadResult;
          console.log('Uploaded category images to Cloudinary:', uploadedImageUrls);
        } catch (error) {
          console.error('Image upload error:', error);
          showError('Failed to upload images. Please try again.');
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Merge uploaded URLs with existing formData, prioritizing Cloudinary URLs
      const finalData: CategoryFormData = {
        ...formData,
        image: uploadedImageUrls.image || formData.image,
        image2: uploadedImageUrls.image2 || formData.image2,
        image3: uploadedImageUrls.image3 || formData.image3,
      };

      // Filter out base64 strings from final data
      if (finalData.image?.startsWith('data:image')) finalData.image = '';
      if (finalData.image2?.startsWith('data:image')) finalData.image2 = '';
      if (finalData.image3?.startsWith('data:image')) finalData.image3 = '';

      if (editingCategory) {
        await adminAPI.categories.update(editingCategory.id, finalData);
        showSuccess('Category updated successfully');
      } else {
        await adminAPI.categories.create(finalData);
        showSuccess('Category created successfully');
      }
      closeModal();
      fetchCategories();
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Failed to save category');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"? This will affect all products in this category.`)) {
      try {
        await adminAPI.categories.delete(id);
        showSuccess('Category deleted successfully');
        fetchCategories();
      } catch (error: unknown) {
        if (error instanceof Error) {
          showError(error.message);
        } else {
          showError('Failed to delete category');
        }
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-red-600" />
            Category Management
          </h1>
          <p className="text-gray-600 mt-2">Organize your product categories</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
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

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-gray-600 mt-4">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                )}

                {/* Category Images */}
                <div className="grid grid-cols-3 gap-2">
                  {[category.image, category.image2, category.image3].map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`${category.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label ="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Category Images - 3 images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category Images (Up to 3)
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
                              aria-label ="Remove image"
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
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
                    aria-label="Category name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
                    aria-label="Category slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Category description"
                  />
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
                  disabled={submitting || uploadingImages}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(submitting || uploadingImages) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {uploadingImages ? 'Uploading images...' : (submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
