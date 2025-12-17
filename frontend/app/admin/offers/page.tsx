'use client';

import { useState, useEffect } from 'react';
import { Tag, Search, Plus, Edit, Trash2, Clock, Percent, Gift, Filter, ChevronDown } from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED';
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const offersPerPage = 10;

  // Mock data - replace with actual API call
  useEffect(() => {
    setTimeout(() => {
      const mockOffers: Offer[] = [
        {
          id: '1',
          name: 'New Year Special',
          code: 'NEWYEAR2025',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          minPurchase: 1000,
          maxDiscount: 500,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          usageLimit: 1000,
          usageCount: 342,
          status: 'ACTIVE'
        },
        {
          id: '2',
          name: 'Welcome Discount',
          code: 'WELCOME50',
          discountType: 'FIXED',
          discountValue: 50,
          minPurchase: 200,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          usageLimit: 5000,
          usageCount: 1823,
          status: 'ACTIVE'
        },
        {
          id: '3',
          name: 'Black Friday Sale',
          code: 'BLACKFRIDAY',
          discountType: 'PERCENTAGE',
          discountValue: 50,
          minPurchase: 500,
          maxDiscount: 1000,
          startDate: '2024-11-25',
          endDate: '2024-11-30',
          usageLimit: 500,
          usageCount: 500,
          status: 'EXPIRED'
        },
        {
          id: '4',
          name: 'Summer Collection',
          code: 'SUMMER2026',
          discountType: 'PERCENTAGE',
          discountValue: 30,
          minPurchase: 800,
          maxDiscount: 600,
          startDate: '2026-06-01',
          endDate: '2026-08-31',
          usageLimit: 2000,
          usageCount: 0,
          status: 'SCHEDULED'
        },
        {
          id: '5',
          name: 'Free Shipping',
          code: 'FREESHIP',
          discountType: 'FIXED',
          discountValue: 60,
          minPurchase: 500,
          startDate: '2025-01-01',
          endDate: '2025-06-30',
          usageLimit: 10000,
          usageCount: 4567,
          status: 'ACTIVE'
        },
      ];
      setOffers(mockOffers);
      setLoading(false);
    }, 1000);
  }, []);

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
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
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

          {/* Status Filter */}
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

      {/* Offers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-gray-600 mt-4">Loading offers...</p>
          </div>
        ) : currentOffers.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No offers found</p>
            <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Create Your First Offer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOffers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-linear-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Gift className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                            <div className="text-xs text-gray-500">ID: {offer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md w-fit">
                          <Tag className="w-3.5 h-3.5 text-gray-600" />
                          <span className="text-sm font-mono font-semibold text-gray-900">{offer.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-bold text-red-600">
                            {offer.discountType === 'PERCENTAGE'
                              ? `${offer.discountValue}%`
                              : `৳${offer.discountValue}`}
                          </span>
                          {offer.maxDiscount && (
                            <span className="text-xs text-gray-500">(max: ৳{offer.maxDiscount})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">৳{offer.minPurchase.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {offer.usageCount} / {offer.usageLimit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-red-600 h-1.5 rounded-full"
                            style={{ width: `${(offer.usageCount / offer.usageLimit) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div>{new Date(offer.startDate).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              to {new Date(offer.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(offer.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                  Showing {indexOfFirstOffer + 1} to {Math.min(indexOfLastOffer, filteredOffers.length)} of {filteredOffers.length} offers
                </div>
                <div className="flex gap-2">
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
