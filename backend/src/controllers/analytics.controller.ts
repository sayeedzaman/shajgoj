import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

// Get dashboard analytics overview
export const getDashboardAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get total revenue and orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;

    // Get total customers (users with orders)
    const totalCustomers = await prisma.user.count({
      where: {
        role: 'USER',
        createdAt: { gte: startDate },
      },
    });

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period data for comparison
    const prevStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const prevOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: prevStartDate, lt: startDate },
        status: { not: 'CANCELLED' },
      },
    });

    const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total, 0);
    const prevOrdersCount = prevOrders.length;

    const prevCustomers = await prisma.user.count({
      where: {
        role: 'USER',
        createdAt: { gte: prevStartDate, lt: startDate },
      },
    });

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;
    const customersChange = prevCustomers > 0 ? ((totalCustomers - prevCustomers) / prevCustomers) * 100 : 0;
    const prevAvgOrderValue = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;
    const avgOrderValueChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

    res.json({
      totalRevenue: {
        value: totalRevenue,
        change: revenueChange,
        isPositive: revenueChange >= 0,
      },
      totalOrders: {
        value: totalOrders,
        change: ordersChange,
        isPositive: ordersChange >= 0,
      },
      totalCustomers: {
        value: totalCustomers,
        change: customersChange,
        isPositive: customersChange >= 0,
      },
      avgOrderValue: {
        value: avgOrderValue,
        change: avgOrderValueChange,
        isPositive: avgOrderValueChange >= 0,
      },
      conversionRate: {
        value: 3.2, // Mock for now
        change: 0.5,
        isPositive: true,
      },
      cartAbandonment: {
        value: 68.5, // Mock for now
        change: -3.2,
        isPositive: true,
      },
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};

// Get revenue trends over time
export const getRevenueTrends = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range and grouping
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Determine grouping (daily or weekly based on range)
    const groupByWeeks = daysBack > 30;

    // Get all orders in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get all customers in range
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        role: 'USER',
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group data by period
    const groupedData: Record<string, { revenue: number; orders: number; customers: number }> = {};

    const formatDate = (date: Date) => {
      if (groupByWeeks) {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week
        return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // Group by day
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    // Initialize all periods
    const periods = groupByWeeks ? Math.ceil(daysBack / 7) : daysBack;
    for (let i = 0; i < periods; i++) {
      const periodDate = new Date(startDate.getTime() + (i * (groupByWeeks ? 7 : 1) * 24 * 60 * 60 * 1000));
      const key = formatDate(periodDate);
      groupedData[key] = { revenue: 0, orders: 0, customers: 0 };
    }

    // Aggregate orders
    orders.forEach((order) => {
      const key = formatDate(order.createdAt);
      if (groupedData[key]) {
        groupedData[key].revenue += order.total;
        groupedData[key].orders += 1;
      }
    });

    // Aggregate customers
    users.forEach((user) => {
      const key = formatDate(user.createdAt);
      if (groupedData[key]) {
        groupedData[key].customers += 1;
      }
    });

    // Convert to array format
    const revenueData = Object.entries(groupedData).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      customers: data.customers,
    }));

    res.json(revenueData);
  } catch (error) {
    console.error('Get revenue trends error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trends' });
  }
};

// Get top selling products
export const getTopProducts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { limit = '10', timeRange = '30d' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get order items in date range
    const orderItems = await prisma.orderItem.findMany({
      where: {
        Order: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    // Aggregate by product
    const productStats: Record<string, { name: string; sales: number; revenue: number; product: any }> = {};

    orderItems.forEach((item) => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = {
          name: item.Product.name,
          sales: 0,
          revenue: 0,
          product: item.Product,
        };
      }
      productStats[item.productId].sales += item.quantity;
      productStats[item.productId].revenue += item.price * item.quantity;
    });

    // Convert to array and sort by sales
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limitNum)
      .map((stat) => ({
        name: stat.name,
        sales: stat.sales,
        revenue: Math.round(stat.revenue * 100) / 100,
        product: stat.product,
      }));

    res.json(topProducts);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};

// Get sales by category
export const getSalesByCategory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get order items with product categories
    const orderItems = await prisma.orderItem.findMany({
      where: {
        Order: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        quantity: true,
        price: true,
        Product: {
          select: {
            Category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by category
    const categoryStats: Record<string, { name: string; value: number; count: number }> = {};

    orderItems.forEach((item) => {
      const categoryId = item.Product.Category.id;
      const categoryName = item.Product.Category.name;

      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = {
          name: categoryName,
          value: 0,
          count: 0,
        };
      }
      categoryStats[categoryId].value += item.price * item.quantity;
      categoryStats[categoryId].count += item.quantity;
    });

    // Calculate total revenue for percentages
    const totalValue = Object.values(categoryStats).reduce((sum, cat) => sum + cat.value, 0);

    // Convert to array format
    const categoryData = Object.values(categoryStats)
      .sort((a, b) => b.value - a.value)
      .map((stat) => ({
        name: stat.name,
        value: Math.round(stat.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((stat.value / totalValue) * 100) : 0,
        count: stat.count,
      }));

    res.json(categoryData);
  } catch (error) {
    console.error('Get sales by category error:', error);
    res.status(500).json({ error: 'Failed to fetch sales by category' });
  }
};

// Get customer growth data
export const getCustomerGrowth = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { timeRange = '6m' } = req.query;

    // Calculate date range (last 6 months by default)
    const now = new Date();
    const monthsBack = timeRange === '3m' ? 3 : timeRange === '1y' ? 12 : 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

    // Get all users
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
        role: 'USER',
      },
      select: {
        id: true,
        createdAt: true,
        Order: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1,
        },
      },
    });

    // Group by month
    const monthlyData: Record<string, { new: number; returning: number }> = {};

    // Initialize months
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - i - 1), 1);
      const key = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[key] = { new: 0, returning: 0 };
    }

    // Count new users per month
    users.forEach((user) => {
      const userMonth = user.createdAt.toLocaleDateString('en-US', { month: 'short' });
      if (monthlyData[userMonth]) {
        monthlyData[userMonth].new += 1;
      }
    });

    // For returning customers, we'll estimate based on repeat orders
    const repeatOrders = await prisma.order.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      having: {
        id: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    // Distribute returning customers evenly across months (simplified)
    const returningCustomersPerMonth = Math.floor(repeatOrders.length / monthsBack);
    Object.keys(monthlyData).forEach((month, index) => {
      monthlyData[month].returning = returningCustomersPerMonth + (index < repeatOrders.length % monthsBack ? 1 : 0);
    });

    // Convert to array
    const customerGrowth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      new: data.new,
      returning: data.returning,
    }));

    res.json(customerGrowth);
  } catch (error) {
    console.error('Get customer growth error:', error);
    res.status(500).json({ error: 'Failed to fetch customer growth data' });
  }
};

// Get recent orders for dashboard
export const getRecentOrders = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { limit = '5' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const orders = await prisma.order.findMany({
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        OrderItem: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.orderNumber,
      customer: order.User.firstName && order.User.lastName
        ? `${order.User.firstName} ${order.User.lastName}`
        : order.User.email,
      amount: order.total,
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0],
      itemCount: order.OrderItem.reduce((sum, item) => sum + item.quantity, 0),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
};
