'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tag, Search, Plus, Edit, Trash2, Clock, Filter, ChevronDown, X, Upload, Image as ImageIcon, Package, Sparkles } from 'lucide-react';
import type { Product } from '@/src/types/index';

interface Offer {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  // Link options - either custom URL or specific product
  linkType: 'url' | 'product'; // Type of link
  link?: string; // Custom URL (e.g., /sales, /category/makeup)
  productId?: string; // Specific product ID to link to
  productName?: string; // Product name (for display in admin)
  productImage?: string; // Product image (for display in admin)
  type: 'hero' | 'deal' | 'brand' | 'limited'; // Type of offer for homepage sections
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED';
  displayOnHomepage: boolean;
  priority: number; // Order of display (higher = shows first)
  // Visual styling options for striking offer cards
  backgroundColor?: string; // Gradient classes like 'from-pink-500 to-purple-600'
  textColor?: string; // Text color classes like 'text-white'
  badgeColor?: string; // Badge color classes like 'bg-yellow-400 text-purple-900'
  borderStyle?: 'wavy' | 'rounded' | 'sharp' | 'irregular';
  cardStyle?: 'gradient' | 'solid' | 'image';
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const offersPerPage = 10;

  // Product search state
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchLoading, setProductSearchLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    imageUrl: '',
    linkType: 'url' as 'url' | 'product',
    link: '', // Custom URL
    productId: '',
    productName: '',
    productImage: '',
    type: 'deal' as 'hero' | 'deal' | 'brand' | 'limited',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    displayOnHomepage: false,
    priority: 1,
    // Visual styling options
    backgroundColor: 'from-red-500 via-pink-500 to-rose-600',
    textColor: 'text-white',
    badgeColor: 'bg-yellow-400 text-red-900',
    borderStyle: 'wavy' as 'wavy' | 'rounded' | 'sharp' | 'irregular',
    cardStyle: 'gradient' as 'gradient' | 'solid' | 'image',
  });

  // Load offers from localStorage on mount
  useEffect(() => {
    const savedOffers = localStorage.getItem('admin_offers');
    if (savedOffers) {
      setOffers(JSON.parse(savedOffers));
    } else {
      // Initialize with mock data
      const mockOffers: Offer[] = [
        {
          id: '1',
          name: 'New Year Special',
          code: 'NEWYEAR2025',
          description: 'Start the new year with amazing discounts!',
          imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
          linkType: 'url',
          link: '/sales',
          type: 'hero',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          minPurchase: 1000,
          maxDiscount: 500,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          usageLimit: 1000,
          usageCount: 342,
          status: 'ACTIVE',
          displayOnHomepage: true,
          priority: 10
        },
        {
          id: '2',
          name: 'Welcome Discount',
          code: 'WELCOME50',
          description: 'Get ৳50 off on your first order',
          imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800',
          linkType: 'url',
          link: '/offers',
          type: 'deal',
          discountType: 'FIXED',
          discountValue: 50,
          minPurchase: 200,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          usageLimit: 5000,
          usageCount: 1823,
          status: 'ACTIVE',
          displayOnHomepage: true,
          priority: 5
        },
      ];
      setOffers(mockOffers);
      localStorage.setItem('admin_offers', JSON.stringify(mockOffers));
    }
    setLoading(false);
  }, []);

  // Save offers to localStorage whenever they change
  const saveOffers = (updatedOffers: Offer[]) => {
    setOffers(updatedOffers);
    localStorage.setItem('admin_offers', JSON.stringify(updatedOffers));
  };

  const openModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        name: offer.name,
        code: offer.code,
        description: offer.description || '',
        imageUrl: offer.imageUrl || '',
        linkType: offer.linkType || 'url',
        link: offer.link || '',
        productId: offer.productId || '',
        productName: offer.productName || '',
        productImage: offer.productImage || '',
        type: offer.type || 'deal',
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minPurchase: offer.minPurchase,
        maxDiscount: offer.maxDiscount || 0,
        startDate: offer.startDate,
        endDate: offer.endDate,
        usageLimit: offer.usageLimit,
        displayOnHomepage: offer.displayOnHomepage,
        priority: offer.priority || 1,
        // Visual styling options
        backgroundColor: offer.backgroundColor || 'from-red-500 via-pink-500 to-rose-600',
        textColor: offer.textColor || 'text-white',
        badgeColor: offer.badgeColor || 'bg-yellow-400 text-red-900',
        borderStyle: offer.borderStyle || 'wavy',
        cardStyle: offer.cardStyle || 'gradient',
      });
      setImagePreview(offer.imageUrl || '');
      if (offer.productId && offer.productName) {
        setSelectedProduct({
          id: offer.productId,
          name: offer.productName,
          slug: '',
          description: null,
          price: 0,
          salePrice: null,
          stock: 0,
          images: offer.productImage ? [offer.productImage] : [],
          imageUrl: offer.productImage || null,
          featured: false,
          categoryId: '',
          Category: { id: '', name: '', slug: '' },
          brandId: null,
          Brand: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      setEditingOffer(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        imageUrl: '',
        linkType: 'url',
        link: '',
        productId: '',
        productName: '',
        productImage: '',
        type: 'deal',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: '',
        endDate: '',
        usageLimit: 100,
        displayOnHomepage: false,
        priority: 1,
        // Visual styling options
        backgroundColor: 'from-red-500 via-pink-500 to-rose-600',
        textColor: 'text-white',
        badgeColor: 'bg-yellow-400 text-red-900',
        borderStyle: 'wavy',
        cardStyle: 'gradient',
      });
      setImagePreview('');
      setSelectedProduct(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      imageUrl: '',
      linkType: 'url',
      link: '',
      productId: '',
      productName: '',
      productImage: '',
      type: 'deal',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minPurchase: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 100,
      displayOnHomepage: false,
      priority: 1,
      // Visual styling options
      backgroundColor: 'from-red-500 via-pink-500 to-rose-600',
      textColor: 'text-white',
      badgeColor: 'bg-yellow-400 text-red-900',
      borderStyle: 'wavy',
      cardStyle: 'gradient',
    });
    setImagePreview('');
    setSelectedProduct(null);
    setProductSearchQuery('');
    setShowProductSearch(false);
  };

  // Search products from Prisma database
  useEffect(() => {
    const searchProducts = async () => {
      if (productSearchQuery.length >= 2) {
        setProductSearchLoading(true);
        try {
          // Fetch from Prisma-powered backend API
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/api/products?search=${encodeURIComponent(productSearchQuery)}&limit=10`);

          if (response.ok) {
            const data = await response.json();
            // Transform backend response to match our Product interface
            const transformedProducts = (data.products || []).map((p: Product) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              imageUrl: p.images?.[0] || '',
              price: p.price,
              salePrice: p.salePrice,
            }));
            setProducts(transformedProducts);
            setShowProductSearch(true);
          }
        } catch (apiError) {
          console.error('Error fetching products from database:', apiError);
          setProducts([]);
          setShowProductSearch(false);
        } finally {
          setProductSearchLoading(false);
        }
      } else {
        setProducts([]);
        setShowProductSearch(false);
        setProductSearchLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearchQuery]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl || product.images?.[0] || '',
    });
    setShowProductSearch(false);
    setProductSearchQuery('');
  };

  const handleRemoveProduct = () => {
    setSelectedProduct(null);
    setFormData({
      ...formData,
      productId: '',
      productName: '',
      productImage: '',
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine status based on dates
    const now = new Date();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    let status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED' = 'ACTIVE';

    if (now < start) {
      status = 'SCHEDULED';
    } else if (now > end) {
      status = 'EXPIRED';
    }

    if (editingOffer) {
      // Update existing offer
      const updatedOffers = offers.map(offer =>
        offer.id === editingOffer.id
          ? {
              ...offer,
              ...formData,
              status,
            }
          : offer
      );
      saveOffers(updatedOffers);
    } else {
      // Create new offer
      const newOffer: Offer = {
        id: Date.now().toString(),
        ...formData,
        usageCount: 0,
        status,
      };
      saveOffers([...offers, newOffer]);
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      const updatedOffers = offers.filter(offer => offer.id !== id);
      saveOffers(updatedOffers);
    }
  };

  const getStatusBadge = (status: Offer['status']) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      EXPIRED: 'bg-red-100 text-red-800 border-red-200',
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch =
      offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || offer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = filteredOffers.slice(indexOfFirstOffer, indexOfLastOffer);
  const totalPages = Math.ceil(filteredOffers.length / offersPerPage);

  const offerStats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'ACTIVE').length,
    expired: offers.filter(o => o.status === 'EXPIRED').length,
    scheduled: offers.filter(o => o.status === 'SCHEDULED').length,
    homepage: offers.filter(o => o.displayOnHomepage).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Tag className="w-8 h-8 text-red-600" />
            Offers & Promotions
          </h1>
          <p className="text-gray-600 mt-2">Create and manage discount codes and promotional offers</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Offers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{offerStats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-800">Active</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{offerStats.active}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-800">Scheduled</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{offerStats.scheduled}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-800">Expired</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{offerStats.expired}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-sm text-purple-800">On Homepage</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{offerStats.homepage}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by offer name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-gray-600 mt-4">Loading offers...</p>
          </div>
        ) : currentOffers.length === 0 ? (
          <div className="col-span-full p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No offers found</p>
            <button
              onClick={() => openModal()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Create Your First Offer
            </button>
          </div>
        ) : (
          currentOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Offer Image */}
              <div className="relative h-48 bg-gray-100">
                {offer.imageUrl ? (
                  <Image
                    src={offer.imageUrl}
                    alt={offer.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {offer.displayOnHomepage && (
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    Homepage
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(offer.status)}
                </div>
              </div>

              {/* Offer Details */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{offer.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm font-mono font-semibold text-gray-700">{offer.code}</span>
                </div>
                {offer.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-bold text-red-600">
                      {offer.discountType === 'PERCENTAGE'
                        ? `${offer.discountValue}%`
                        : `৳${offer.discountValue}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Min Purchase:</span>
                    <span className="font-semibold text-gray-900">৳{offer.minPurchase}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Usage:</span>
                    <span className="font-semibold text-gray-900">
                      {offer.usageCount} / {offer.usageLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{ width: `${(offer.usageCount / offer.usageLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(offer)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                currentPage === i + 1
                  ? 'bg-red-600 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative w-full h-48">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, imageUrl: '' });
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Or enter image URL below</p>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, imageUrl: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Code*</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Type*
                    <span className="text-xs text-gray-500 ml-2">(Appearance on homepage)</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'hero' | 'deal' | 'brand' | 'limited' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="hero">Hero Banner (Top Slider)</option>
                    <option value="deal">Deal Card (Deals Section)</option>
                    <option value="brand">Brand Ad (Brands Section)</option>
                    <option value="limited">Limited Offer (Limited Time Section)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority*
                    <span className="text-xs text-gray-500 ml-2">(Higher number = shows first)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="1-100"
                  />
                </div>
              </div>

              {/* Link Type & Destination */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Where should this banner/offer redirect to?*
                </label>

                {/* Link Type Selector */}
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkType: 'url', productId: '', productName: '', productImage: '' })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      formData.linkType === 'url'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Tag className="w-5 h-5" />
                      <span className="font-medium">Custom URL</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">Link to category, sales page, etc.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, linkType: 'product', link: '' });
                      setSelectedProduct(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                      formData.linkType === 'product'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Specific Product</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">Link to a product page</p>
                  </button>
                </div>

                {/* Custom URL Input */}
                {formData.linkType === 'url' && (
                  <div>
                    <input
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="/sales or /products/category-name or https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Examples: <code className="bg-gray-100 px-1 rounded">/sales</code>, <code className="bg-gray-100 px-1 rounded">/products</code>, <code className="bg-gray-100 px-1 rounded">/category/makeup</code>
                    </p>
                  </div>
                )}

                {/* Product Selection */}
                {formData.linkType === 'product' && (
                  <div>
                    {selectedProduct ? (
                      /* Selected Product Display */
                      <div className="border border-green-300 rounded-lg p-3 bg-green-50">
                        <div className="flex items-center gap-3">
                          {(selectedProduct.imageUrl || selectedProduct.images?.[0]) && (
                            <div className="relative w-16 h-16">
                              <Image
                                src={selectedProduct.imageUrl || selectedProduct.images?.[0] || ''}
                                alt={selectedProduct.name}
                                fill
                                className="object-cover rounded border border-gray-300"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                            <p className="text-sm text-gray-600">Product ID: {selectedProduct.id}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveProduct}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Product Search */
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => {
                              setProductSearchQuery(e.target.value);
                              setShowProductSearch(true);
                            }}
                            onFocus={() => setShowProductSearch(true)}
                            placeholder="Search for a product by name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                          {productSearchLoading ? (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Loading State */}
                        {productSearchLoading && productSearchQuery.length >= 2 && (
                          <div className="mt-2 border border-gray-300 rounded-lg bg-white shadow-lg p-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm text-gray-600">Searching products...</p>
                            </div>
                          </div>
                        )}

                        {/* Search Results Dropdown */}
                        {!productSearchLoading && showProductSearch && products.length > 0 && (
                          <div className="mt-2 border border-gray-300 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
                            {products.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductSelect(product)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                {(product.imageUrl || product.images?.[0]) && (
                                  <div className="relative w-12 h-12 shrink-0">
                                    <Image
                                      src={product.imageUrl || product.images?.[0] || ''}
                                      alt={product.name}
                                      fill
                                      className="object-cover rounded border border-gray-200"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-600">
                                    ৳{product.salePrice || product.price}
                                    {product.salePrice && (
                                      <span className="line-through ml-2 text-gray-400">
                                        ৳{product.price}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {!productSearchLoading && showProductSearch && productSearchQuery.length >= 2 && products.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">No products found. Try a different search term.</p>
                        )}

                        {productSearchQuery.length > 0 && productSearchQuery.length < 2 && (
                          <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type*</label>
                  <select
                    required
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.discountType === 'PERCENTAGE' ? 'Discount %*' : 'Amount (৳)*'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase (৳)*</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit*</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Visual Styling Options */}
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Card Visual Styling (For Homepage)
                </h4>
                <p className="text-xs text-purple-700 mb-4">Customize how this offer card appears on the homepage</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Card Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Style</label>
                    <select
                      value={formData.cardStyle}
                      onChange={(e) => setFormData({ ...formData, cardStyle: e.target.value as 'gradient' | 'solid' | 'image' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="gradient">Gradient Background</option>
                      <option value="solid">Solid Color</option>
                      <option value="image">Image Background</option>
                    </select>
                  </div>

                  {/* Border Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Style</label>
                    <select
                      value={formData.borderStyle}
                      onChange={(e) => setFormData({ ...formData, borderStyle: e.target.value as 'wavy' | 'rounded' | 'sharp' | 'irregular' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="wavy">Wavy (Irregular Rounded)</option>
                      <option value="rounded">Smooth Rounded</option>
                      <option value="sharp">Sharp Corners</option>
                      <option value="irregular">Highly Irregular</option>
                    </select>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color Preset</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-red-500 via-pink-500 to-rose-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-red-500 via-pink-500 to-rose-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Red to Rose"
                    >
                      <span className="text-white text-xs font-bold">Default</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-orange-400 via-red-500 to-pink-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-orange-400 via-red-500 to-pink-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Orange to Pink"
                    >
                      <span className="text-white text-xs font-bold">Warm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-cyan-400 via-blue-500 to-purple-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-cyan-400 via-blue-500 to-purple-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Cyan to Purple"
                    >
                      <span className="text-white text-xs font-bold">Cool</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-green-400 via-teal-500 to-cyan-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-green-400 via-teal-500 to-cyan-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Green to Cyan"
                    >
                      <span className="text-white text-xs font-bold">Fresh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-yellow-400 via-orange-500 to-red-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Yellow to Red"
                    >
                      <span className="text-white text-xs font-bold">Hot</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, backgroundColor: 'from-purple-400 via-pink-500 to-red-600' })}
                      className="p-3 rounded-lg bg-linear-to-br from-purple-400 via-pink-500 to-red-600 border-2 border-white shadow-md hover:scale-105 transition-transform"
                      title="Purple to Red"
                    >
                      <span className="text-white text-xs font-bold">Bold</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Current: <code className="bg-gray-100 px-1 rounded">{formData.backgroundColor}</code></p>
                </div>

                {/* Text Color Presets */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, textColor: 'text-white' })}
                      className="p-2 rounded-lg bg-gray-800 border-2 border-white shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-white text-xs font-bold">White</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, textColor: 'text-black' })}
                      className="p-2 rounded-lg bg-gray-100 border-2 border-gray-300 shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-black text-xs font-bold">Black</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, textColor: 'text-gray-800' })}
                      className="p-2 rounded-lg bg-gray-200 border-2 border-gray-300 shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-gray-800 text-xs font-bold">Dark Gray</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Current: <code className="bg-gray-100 px-1 rounded">{formData.textColor}</code></p>
                </div>

                {/* Badge Color Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Badge Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeColor: 'bg-yellow-400 text-purple-900' })}
                      className="p-2 rounded-lg bg-yellow-400 text-purple-900 border-2 border-white shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">Yellow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeColor: 'bg-white text-pink-600' })}
                      className="p-2 rounded-lg bg-white text-pink-600 border-2 border-gray-300 shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">White</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeColor: 'bg-green-400 text-green-900' })}
                      className="p-2 rounded-lg bg-green-400 text-green-900 border-2 border-white shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">Green</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeColor: 'bg-orange-400 text-orange-900' })}
                      className="p-2 rounded-lg bg-orange-400 text-orange-900 border-2 border-white shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">Orange</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Current: <code className="bg-gray-100 px-1 rounded">{formData.badgeColor}</code></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="displayOnHomepage"
                  checked={formData.displayOnHomepage}
                  onChange={(e) => setFormData({ ...formData, displayOnHomepage: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="displayOnHomepage" className="text-sm font-medium text-gray-700">
                  Display this offer on homepage
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
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
