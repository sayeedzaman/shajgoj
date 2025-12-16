'use client';

import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import StatCard from '@/src/components/admin/StatCard';
import StatusBadge from '@/src/components/admin/StatusBadge';
import { adminProductsAPI, type InventoryStats } from '@/src/lib/adminApi';

// Types
interface RevenueDataPoint {
  month: string;
  revenue: number;
  orders: number;
}

interface OrderData {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

// Mock Data - Replace with real API calls
const MOCK_REVENUE_DATA: RevenueDataPoint[] = [
  { month: 'Jan', revenue: 12400, orders: 145 },
  { month: 'Feb', revenue: 15600, orders: 178 },
  { month: 'Mar', revenue: 18900, orders: 203 },
  { month: 'Apr', revenue: 16200, orders: 189 },
  { month: 'May', revenue: 21300, orders: 234 },
  { month: 'Jun', revenue: 24800, orders: 267 },
];

const MOCK_ORDERS: OrderData[] = [
  { id: 'ORD-001', customer: 'John Doe', amount: 129.99, status: 'DELIVERED', date: '2024-01-15' },
  { id: 'ORD-002', customer: 'Jane Smith', amount: 89.50, status: 'PROCESSING', date: '2024-01-15' },
  { id: 'ORD-003', customer: 'Bob Johnson', amount: 199.99, status: 'SHIPPED', date: '2024-01-14' },
  { id: 'ORD-004', customer: 'Alice Brown', amount: 54.99, status: 'PENDING', date: '2024-01-14' },
  { id: 'ORD-005', customer: 'Charlie Wilson', amount: 149.99, status: 'DELIVERED', date: '2024-01-13' },
];

export default function AdminDashboard() {
  // State Management
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stats on Mount
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // API Calls
  const loadDashboardStats = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminProductsAPI.getStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard statistics';
      setError(errorMessage);
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadDashboardStats}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s an overview of your store performance.</p>
      </header>

      {/* Statistics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats?.overview.totalProducts || 0}
          icon={Package}
          iconColor="bg-blue-500"
          subtitle={`${stats?.overview.inStock || 0} in stock`}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.overview.totalValue || 0).toFixed(2)}`}
          icon={DollarSign}
          iconColor="bg-green-500"
          subtitle="This month"
          trend={{ value: 8.5, isPositive: true }}
        />
        <StatCard
          title="Total Orders"
          value="267"
          icon={ShoppingCart}
          iconColor="bg-purple-500"
          subtitle="24 pending"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.overview.lowStock || 0}
          icon={AlertTriangle}
          iconColor="bg-orange-500"
          subtitle={`${stats?.overview.outOfStock || 0} out of stock`}
          trend={{ value: 3, isPositive: false }}
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Last 6 months performance</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">+12.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MOCK_REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ fill: '#f43f5e', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Products by Category Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Products by Category</h2>
            <p className="text-sm text-gray-500 mt-1">Category distribution overview</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.byCategory.slice(0, 6) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="category.name"
                stroke="#9ca3af"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
                tickLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                cursor={{ fill: 'rgba(244, 63, 94, 0.1)' }}
              />
              <Bar
                dataKey="count"
                fill="#f43f5e"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Orders Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Latest customer orders and transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Amount', 'Status', 'Date', 'Actions'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{order.customer}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      ${order.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} variant="order" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{order.date}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Low Stock Alert Banner */}
      {stats && stats.overview.lowStock > 0 && (
        <section className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-xl shadow-sm">
              <AlertTriangle className="w-7 h-7 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900">Low Stock Alert</h3>
              <p className="text-sm text-orange-800 mt-2 leading-relaxed">
                You have <strong>{stats.overview.lowStock}</strong> product(s) with low stock and{' '}
                <strong>{stats.overview.outOfStock}</strong> out of stock items that need immediate attention.
              </p>
              <a
                href="/admin/inventory"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
              >
                View Inventory
                <span>→</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
