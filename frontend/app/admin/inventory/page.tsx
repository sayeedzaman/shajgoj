'use client';

import { useState, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, TrendingUp, TrendingDown, Package, Filter, ChevronDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  price: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data - replace with actual API call
  useEffect(() => {
    setTimeout(() => {
      const mockInventory: InventoryItem[] = [
        {
          id: '1',
          productName: 'Himalaya Face Wash',
          sku: 'HIM-FW-001',
          category: 'Skin Care',
          brand: 'Himalaya',
          currentStock: 150,
          minStock: 50,
          maxStock: 500,
          price: 250,
          status: 'IN_STOCK'
        },
        {
          id: '2',
          productName: 'Nivea Soft Cream',
          sku: 'NIV-SC-002',
          category: 'Skin Care',
          brand: 'Nivea',
          currentStock: 25,
          minStock: 30,
          maxStock: 300,
          price: 450,
          status: 'LOW_STOCK'
        },
        {
          id: '3',
          productName: 'LOreal Lipstick Red',
          sku: 'LOR-LP-003',
          category: 'Makeup',
          brand: 'LOreal',
          currentStock: 0,
          minStock: 20,
          maxStock: 200,
          price: 850,
          status: 'OUT_OF_STOCK'
        },
        {
          id: '4',
          productName: 'Pantene Shampoo',
          sku: 'PAN-SH-004',
          category: 'Hair Care',
          brand: 'Pantene',
          currentStock: 200,
          minStock: 40,
          maxStock: 400,
          price: 380,
          status: 'IN_STOCK'
        },
        {
          id: '5',
          productName: 'Dove Soap',
          sku: 'DOV-SP-005',
          category: 'Personal Care',
          brand: 'Dove',
          currentStock: 15,
          minStock: 25,
          maxStock: 250,
          price: 120,
          status: 'LOW_STOCK'
        },
        {
          id: '6',
          productName: 'Maybelline Mascara',
          sku: 'MAY-MS-006',
          category: 'Makeup',
          brand: 'Maybelline',
          currentStock: 80,
          minStock: 30,
          maxStock: 150,
          price: 950,
          status: 'IN_STOCK'
        },
      ];
      setInventory(mockInventory);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: InventoryItem['status'], currentStock: number) => {
    const styles = {
      IN_STOCK: 'bg-green-100 text-green-800 border-green-200',
      LOW_STOCK: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      OUT_OF_STOCK: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      IN_STOCK: TrendingUp,
      LOW_STOCK: AlertTriangle,
      OUT_OF_STOCK: TrendingDown,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const inventoryStats = {
    totalProducts: inventory.length,
    inStock: inventory.filter(i => i.status === 'IN_STOCK').length,
    lowStock: inventory.filter(i => i.status === 'LOW_STOCK').length,
    outOfStock: inventory.filter(i => i.status === 'OUT_OF_STOCK').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.price), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-red-600" />
          Inventory Management
        </h1>
        <p className="text-gray-600 mt-2">Monitor and manage product stock levels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{inventoryStats.totalProducts}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-800">In Stock</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{inventoryStats.inStock}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{inventoryStats.lowStock}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-800">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{inventoryStats.outOfStock}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-800">Total Value</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">৳{inventoryStats.totalValue.toLocaleString()}</p>
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
              placeholder="Search by product name, SKU, or brand..."
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
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-gray-600 mt-4">Loading inventory...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-12 text-center">
            <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No inventory items found</p>
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
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min/Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.brand}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">{item.currentStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {item.minStock} / {item.maxStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">৳{item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status, item.currentStock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ৳{(item.currentStock * item.price).toLocaleString()}
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
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} items
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
