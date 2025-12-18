'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Mock data
  const revenueData = [
    { date: 'Jan 1', revenue: 12400, orders: 145, customers: 98 },
    { date: 'Jan 8', revenue: 15600, orders: 178, customers: 112 },
    { date: 'Jan 15', revenue: 18900, orders: 203, customers: 134 },
    { date: 'Jan 22', revenue: 16200, orders: 189, customers: 121 },
    { date: 'Jan 29', revenue: 21300, orders: 234, customers: 156 },
    { date: 'Feb 5', revenue: 24800, orders: 267, customers: 178 },
    { date: 'Feb 12', revenue: 28500, orders: 291, customers: 201 },
  ];

  const categoryData = [
    { name: 'Skin Care', value: 3500, percentage: 35 },
    { name: 'Makeup', value: 2800, percentage: 28 },
    { name: 'Hair Care', value: 1800, percentage: 18 },
    { name: 'Fragrance', value: 1200, percentage: 12 },
    { name: 'Others', value: 700, percentage: 7 },
  ];

  const topProducts = [
    { name: 'Himalaya Face Wash', sales: 1245, revenue: 311250 },
    { name: 'Nivea Soft Cream', sales: 987, revenue: 444150 },
    { name: 'LOreal Lipstick', sales: 856, revenue: 727600 },
    { name: 'Pantene Shampoo', sales: 745, revenue: 283100 },
    { name: 'Dove Soap', sales: 623, revenue: 74760 },
  ];

  const customerGrowth = [
    { month: 'Aug', new: 145, returning: 89 },
    { month: 'Sep', new: 178, returning: 112 },
    { month: 'Oct', new: 203, returning: 145 },
    { month: 'Nov', new: 189, returning: 167 },
    { month: 'Dec', new: 234, returning: 198 },
    { month: 'Jan', new: 267, returning: 223 },
  ];

  const COLORS = ['#f43f5e', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];

  const stats = {
    totalRevenue: { value: 127800, change: 12.5, isPositive: true },
    totalOrders: { value: 1507, change: 8.3, isPositive: true },
    totalCustomers: { value: 890, change: 15.2, isPositive: true },
    avgOrderValue: { value: 84.8, change: -2.1, isPositive: false },
    conversionRate: { value: 3.2, change: 0.5, isPositive: true },
    cartAbandonment: { value: 68.5, change: -3.2, isPositive: true },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-red-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Track your business performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.totalRevenue.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalRevenue.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.totalRevenue.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">৳{stats.totalRevenue.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">vs previous period</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.totalOrders.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalOrders.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.totalOrders.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">vs previous period</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.totalCustomers.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalCustomers.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.totalCustomers.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Customers</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">vs previous period</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.avgOrderValue.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.avgOrderValue.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.avgOrderValue.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</h3>
          <p className="text-3xl font-bold text-gray-900">৳{stats.avgOrderValue.value.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">vs previous period</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.conversionRate.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.conversionRate.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.conversionRate.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.value}%</p>
          <p className="text-xs text-gray-500 mt-2">vs previous period</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-yellow-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.cartAbandonment.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {stats.cartAbandonment.isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {Math.abs(stats.cartAbandonment.change)}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Cart Abandonment</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.cartAbandonment.value}%</p>
          <p className="text-xs text-gray-500 mt-2">Lower is better</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `৳${value / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sales by Category</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="new" fill="#f43f5e" radius={[8, 8, 0, 0]} name="New Customers" />
              <Bar dataKey="returning" fill="#ec4899" radius={[8, 8, 0, 0]} name="Returning Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders vs Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Orders vs Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `৳${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2} name="Revenue (৳)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.sales.toLocaleString()} units</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">৳{product.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${(product.sales / topProducts[0].sales) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
