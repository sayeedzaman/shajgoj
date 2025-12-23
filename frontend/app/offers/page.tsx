'use client';

import { useState, useEffect } from 'react';
import { Gift, Tag, Copy, Check, Search, Calendar, TrendingUp, Percent } from 'lucide-react';

// NOTE: Backend API for offers is not yet implemented
// Required endpoints: GET /api/offers, POST /api/cart/apply-offer

interface Offer {
  id: string;
  name: string;
  code: string;
  description?: string;
  imageUrl?: string;
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
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'PERCENTAGE' | 'FIXED'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/offers');
      // const data = await response.json();
      // setOffers(data.offers.filter((o: Offer) => o.status === 'ACTIVE'));

      // Load from localStorage (synced with admin)
      const savedOffers = localStorage.getItem('admin_offers');
      if (savedOffers) {
        const allOffers: Offer[] = JSON.parse(savedOffers);
        const activeOffers = allOffers.filter(o => o.status === 'ACTIVE');
        setOffers(activeOffers);
      } else {
        // Mock data
        const mockOffers: Offer[] = [
          {
            id: '1',
            name: 'New Year Special',
            code: 'NEWYEAR2025',
            description: 'Start the new year with amazing discounts!',
            imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
            discountType: 'PERCENTAGE',
            discountValue: 25,
            minPurchase: 1000,
            maxDiscount: 500,
            startDate: '2025-01-01',
            endDate: '2025-01-31',
            usageLimit: 1000,
            usageCount: 342,
            status: 'ACTIVE',
            displayOnHomepage: true
          },
          {
            id: '2',
            name: 'Welcome Discount',
            code: 'WELCOME50',
            description: 'Get ৳50 off on your first order',
            imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800',
            discountType: 'FIXED',
            discountValue: 50,
            minPurchase: 200,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            usageLimit: 5000,
            usageCount: 1823,
            status: 'ACTIVE',
            displayOnHomepage: true
          },
          {
            id: '3',
            name: 'Mega Sale',
            code: 'MEGA30',
            description: 'Biggest sale of the year!',
            imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
            discountType: 'PERCENTAGE',
            discountValue: 30,
            minPurchase: 1500,
            maxDiscount: 750,
            startDate: '2025-01-15',
            endDate: '2025-02-15',
            usageLimit: 500,
            usageCount: 89,
            status: 'ACTIVE',
            displayOnHomepage: false
          },
        ];
        setOffers(mockOffers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
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

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
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
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Backend Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800">
            <strong>⚠️ Note:</strong> Backend API not yet implemented. Currently showing mock data from localStorage.
            <br />
            <span className="text-xs">Required endpoint: GET /api/offers</span>
          </p>
        </div>

        {/* Offers Grid */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const daysLeft = getDaysRemaining(offer.endDate);
              const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Offer Image */}
                  <div className="relative h-48 bg-gradient-to-br from-red-100 to-purple-100">
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-red-500 text-white rounded-lg shadow-xl px-4 py-2">
                        <div className="text-2xl font-bold">
                          {offer.discountType === 'PERCENTAGE'
                            ? `${offer.discountValue}%`
                            : `৳${offer.discountValue}`
                          }
                        </div>
                        <div className="text-xs">OFF</div>
                      </div>
                    </div>

                    {/* Days Left Badge */}
                    {isExpiringSoon && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {daysLeft} days left
                      </div>
                    )}
                  </div>

                  {/* Offer Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {offer.name}
                    </h3>

                    {offer.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Offer Code */}
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Promo Code</div>
                          <div className="text-lg font-mono font-bold text-red-600">
                            {offer.code}
                          </div>
                        </div>
                        <button
                          onClick={() => copyCode(offer.code)}
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

                    {/* Offer Details */}
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

                      {/* Usage Bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Used</span>
                          <span>{offer.usageCount} / {offer.usageLimit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${(offer.usageCount / offer.usageLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => copyCode(offer.code)}
                      className="w-full mt-4 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105"
                    >
                      {copiedCode === offer.code ? 'Code Copied!' : 'Copy Code & Shop'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How to Use Section */}
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
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Copy the Code</h3>
              <p className="text-sm text-gray-600">
                Click to copy the promo code to your clipboard
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Apply at Checkout</h3>
              <p className="text-sm text-gray-600">
                Paste the code during checkout and enjoy your discount!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
