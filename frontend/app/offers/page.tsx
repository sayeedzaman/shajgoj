'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Tag, Copy, Check, Search, Calendar, TrendingUp, Percent, ShoppingBag, ArrowLeft } from 'lucide-react';


interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  imageUrl?: string;
  images?: string[];
  category?: {
    name: string;
  };
}

interface Offer {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
  type: string;
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
  showPlainImage?: boolean;
  OfferProduct?: Array<{
    id: string;
    Product: Product;
  }>;
}

function OffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offerId');

  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'PERCENTAGE' | 'FIXED'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'offers' | 'products'>('offers');
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (offerId) {
      fetchOfferWithProducts(offerId);
    } else {
      fetchOffers();
    }
  }, [offerId]);

  const fetchOfferWithProducts = async (id: string) => {
    try {
      setLoading(true);
      setViewMode('products');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/offers/${id}`);

      if (response.ok) {
        const offer = await response.json();
        setCurrentOffer(offer);

        // Extract products from OfferProduct relationship
        if (offer.OfferProduct && offer.OfferProduct.length > 0) {
          const offerProducts = offer.OfferProduct.map((op: any) => op.Product);
          setProducts(offerProducts);
        } else {
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch offer');
        setViewMode('offers');
        fetchOffers();
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      setViewMode('offers');
      fetchOffers();
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setViewMode('offers');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/offers/active`);

      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      } else {
        console.error('Failed to fetch offers');
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || offer.discountType === filterType;
    return matchesSearch && matchesType;
  });

  // Categorize offers by type
  const dealsYouCannotMiss = filteredOffers.filter(offer => offer.type === 'deals-you-cannot-miss');
  const topBrandsOffers = filteredOffers.filter(offer => offer.type === 'top-brands');
  const otherOffers = filteredOffers.filter(offer => offer.type !== 'deals-you-cannot-miss' && offer.type !== 'top-brands');

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className={`min-h-screen ${viewMode === 'products' ? 'bg-white' : 'bg-linear-to-br from-red-50 via-orange-50 to-amber-50'}`}>
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-8 overflow-hidden">
        {/* Background Image - For both views */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/image.png"
            alt="Offers background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center">
            {viewMode === 'products' && currentOffer ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/offers')}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors mx-auto"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to All Offers
                </button>
                <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {currentOffer.name}
                </h1>
                <p className="text-xl text-white/90 mb-4">
                  {currentOffer.description || 'Browse products included in this special offer'}
                </p>
                <div className="flex justify-center gap-6">
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold">{products.length}</div>
                    <div className="text-sm text-white/80">Products</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold">
                      {currentOffer.discountType === 'PERCENTAGE'
                        ? `${currentOffer.discountValue}%`
                        : `৳${currentOffer.discountValue}`}
                    </div>
                    <div className="text-sm text-white/80">Discount</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <div className="text-lg font-mono font-bold">{currentOffer.code}</div>
                    <div className="text-sm text-white/80">Promo Code</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Gift className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Exclusive Offers & Deals
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  Save more with our amazing discount codes and promotional offers
                </p>
                <div className="flex justify-center gap-6">
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold">{offers.length}</div>
                    <div className="text-sm text-white/80">Active Offers</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold">
                      {Math.max(...offers.map(o => o.discountType === 'PERCENTAGE' ? o.discountValue : 0), 0)}%
                    </div>
                    <div className="text-sm text-white/80">Max Discount</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className={`max-w-7xl mx-auto px-4 py-8 ${viewMode === 'products' ? 'bg-white' : ''}`}>
        {viewMode === 'products' ? (
          /* Products Grid for specific offer */
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ShoppingBag className="w-20 h-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products in this offer</h3>
                <p className="text-gray-600 mb-4">This offer doesn't have any specific products yet</p>
                <Link
                  href="/offers"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  View All Offers
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative h-64 bg-gray-100">
                      {(product.imageUrl || product.images?.[0]) ? (
                        <Image
                          src={product.imageUrl || product.images?.[0] || ''}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {product.salePrice && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-gray-500 mb-2">{product.category.name}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-lg font-bold text-red-600">৳{product.salePrice}</span>
                            <span className="text-sm text-gray-400 line-through">৳{product.price}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Offers Grid */
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('PERCENTAGE')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      filterType === 'PERCENTAGE'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Percent className="w-4 h-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('FIXED')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      filterType === 'FIXED'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Fixed Amount
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading offers...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gift className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Deals You Cannot Miss - Square Layout */}
            {dealsYouCannotMiss.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Deals You Cannot Miss</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dealsYouCannotMiss.map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/offers?offerId=${offer.id}`}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block aspect-square"
                    >
                      {offer.showPlainImage && offer.imageUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={offer.imageUrl}
                            alt={offer.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="relative h-2/3 bg-linear-to-br from-red-100 to-orange-100">
                            {offer.imageUrl ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={offer.imageUrl}
                                  alt={offer.name}
                                  fill
                                  sizes="(max-width: 768px) 50vw, 25vw"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gift className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <div className="bg-red-500 text-white rounded-lg shadow-xl px-2 py-1">
                                <div className="text-lg font-bold">
                                  {offer.discountType === 'PERCENTAGE'
                                    ? `${offer.discountValue}%`
                                    : `৳${offer.discountValue}`}
                                </div>
                                <div className="text-xs">OFF</div>
                              </div>
                            </div>
                          </div>
                          <div className="p-3 h-1/3 flex flex-col justify-center">
                            <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                              {offer.name}
                            </h3>
                            <div className="text-xs font-mono font-bold text-red-600">
                              {offer.code}
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top Brands - Rectangle Layout */}
            {topBrandsOffers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Brands</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topBrandsOffers.map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/offers?offerId=${offer.id}`}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block"
                    >
                      {offer.showPlainImage && offer.imageUrl ? (
                        <div className="relative aspect-[3/2]">
                          <Image
                            src={offer.imageUrl}
                            alt={offer.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="relative aspect-[3/2] bg-linear-to-br from-red-100 to-orange-100">
                            {offer.imageUrl ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={offer.imageUrl}
                                  alt={offer.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gift className="w-16 h-16 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <div className="bg-red-500 text-white rounded-lg shadow-xl px-3 py-2">
                                <div className="text-xl font-bold">
                                  {offer.discountType === 'PERCENTAGE'
                                    ? `${offer.discountValue}%`
                                    : `৳${offer.discountValue}`}
                                </div>
                                <div className="text-xs">OFF</div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="text-base font-bold text-gray-900 mb-2">
                              {offer.name}
                            </h3>
                            <div className="text-sm font-mono font-bold text-red-600">
                              {offer.code}
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Other Offers - Standard Grid */}
            {otherOffers.length > 0 && (
              <div>
                {(dealsYouCannotMiss.length > 0 || topBrandsOffers.length > 0) && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">More Offers</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherOffers.map((offer) => {
                    const daysLeft = getDaysRemaining(offer.endDate);
                    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

                    return (
                      <Link
                        key={offer.id}
                        href={`/offers?offerId=${offer.id}`}
                        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 block"
                      >
                        {offer.showPlainImage && offer.imageUrl ? (
                          <div className="relative h-64">
                            <Image
                              src={offer.imageUrl}
                              alt={offer.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="relative h-48 bg-linear-to-br from-red-100 to-orange-100">
                              {offer.imageUrl ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={offer.imageUrl}
                                    alt={offer.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Gift className="w-16 h-16 text-gray-300" />
                                </div>
                              )}

                              <div className="absolute top-4 left-4">
                                <div className="bg-red-500 text-white rounded-lg shadow-xl px-4 py-2">
                                  <div className="text-2xl font-bold">
                                    {offer.discountType === 'PERCENTAGE'
                                      ? `${offer.discountValue}%`
                                      : `৳${offer.discountValue}`}
                                  </div>
                                  <div className="text-xs">OFF</div>
                                </div>
                              </div>

                              {isExpiringSoon && (
                                <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                  {daysLeft} days left
                                </div>
                              )}
                            </div>

                            <div className="p-6">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {offer.name}
                              </h3>

                              {offer.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {offer.description}
                                </p>
                              )}

                              <div className="bg-linear-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-gray-600 mb-1">Promo Code</div>
                                    <div className="text-lg font-mono font-bold text-red-600">
                                      {offer.code}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      copyCode(offer.code);
                                    }}
                                    className={`p-3 rounded-lg transition-all ${
                                      copiedCode === offer.code
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    {copiedCode === offer.code ? (
                                      <Check className="w-5 h-5" />
                                    ) : (
                                      <Copy className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Min Purchase:</span>
                                  <span className="font-semibold text-gray-900">৳{offer.minPurchase}</span>
                                </div>

                                {offer.maxDiscount && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Max Discount:</span>
                                    <span className="font-semibold text-gray-900">৳{offer.maxDiscount}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-gray-600 pt-2">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-xs">
                                    Valid till {new Date(offer.endDate).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="pt-2">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Used</span>
                                    <span>{offer.usageCount} / {offer.usageLimit}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-linear-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                                      style={{ width: `${Math.min((offer.usageCount / offer.usageLimit) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  copyCode(offer.code);
                                }}
                                className="w-full mt-4 bg-linear-to-r from-red-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105"
                              >
                                {copiedCode === offer.code ? 'Code Copied!' : 'Copy Code & Shop'}
                              </button>
                            </div>
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </section>

      {/* How to Use Section - Only show for offers view */}
      {viewMode === 'offers' && (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Use Promo Codes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Choose an Offer</h3>
              <p className="text-sm text-gray-600">
                Browse and select the best offer that suits your purchase
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Copy the Code</h3>
              <p className="text-sm text-gray-600">
                Click to copy the promo code to your clipboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Apply at Checkout</h3>
              <p className="text-sm text-gray-600">
                Paste the code during checkout and enjoy your discount!
              </p>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
        </div>
      </div>
    }>
      <OffersContent />
    </Suspense>
  );
}
