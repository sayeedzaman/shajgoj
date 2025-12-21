'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Search, Edit, Trash2, X, Upload } from 'lucide-react';
import { adminAPI } from '@/src/lib/adminApi';
import type { Brand } from '@/src/types';

interface BrandFormData {
  name: string;
  slug: string;
  logo?: string;
}

export default function BrandManagementPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    slug: '',
    logo: '',
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const brandsList = await adminAPI.brands.getAll();
      setBrands(brandsList);
    } catch (error) {
      showError('Failed to fetch brands');
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for later upload
      setLogoFile(file);

      // Create preview for display only
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoPreview(url);
    setFormData({ ...formData, logo: url });
  };

  const removeLogo = () => {
    setLogoPreview('');
    setLogoFile(null);
    setFormData({ ...formData, logo: '' });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo || '',
      });
      setLogoPreview(brand.logo || '');
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        logo: '',
      });
      setLogoPreview('');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBrand(null);
    setFormData({
      name: '',
      slug: '',
      logo: '',
    });
    setLogoPreview('');
    setLogoFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      showError('Please enter brand name');
      return;
    }

    try {
      setSubmitting(true);

      // Upload logo to Cloudinary first if there's a file
      let uploadedLogoUrl = '';
      if (logoFile) {
        try {
          setUploadingLogo(true);
          const uploadResult = await adminAPI.upload.uploadBrandLogo(logoFile);
          uploadedLogoUrl = uploadResult.url;
          console.log('Uploaded brand logo to Cloudinary:', uploadedLogoUrl);
        } catch (error) {
          console.error('Logo upload error:', error);
          showError('Failed to upload logo. Please try again.');
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      // Use uploaded URL or existing URL from formData
      const finalData: BrandFormData = {
        ...formData,
        logo: uploadedLogoUrl || formData.logo,
      };

      // Filter out base64 string from final data
      if (finalData.logo?.startsWith('data:image')) {
        finalData.logo = '';
      }

      if (editingBrand) {
        await adminAPI.brands.update(editingBrand.id, finalData);
        showSuccess('Brand updated successfully');
      } else {
        await adminAPI.brands.create(finalData);
        showSuccess('Brand created successfully');
      }
      closeModal();
      fetchBrands();
    } catch (error: unknown) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Failed to save brand');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete brand "${name}"? This will affect all products with this brand.`)) {
      try {
        await adminAPI.brands.delete(id);
        showSuccess('Brand deleted successfully');
        fetchBrands();
      } catch (error: unknown) {
        if (error instanceof Error) {
          showError(error.message);
        } else {
          showError('Failed to delete brand');
        }
      }
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your product brands</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Brand
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Brands Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No brands found</p>
            <button
              onClick={() => openModal()}
              className="mt-4 text-red-600 hover:text-red-700 font-medium"
            >
              Add your first brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Tag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{brand.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{brand.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(brand)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id, brand.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo
                </label>
                <div className="space-y-3">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload logo</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Or enter image URL"
                      value={logoPreview}
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
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
                  disabled={submitting || uploadingLogo}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(submitting || uploadingLogo) && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {uploadingLogo ? 'Uploading logo...' : (submitting ? 'Saving...' : (editingBrand ? 'Update Brand' : 'Create Brand'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
