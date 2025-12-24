'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { adminAPI } from './adminApi';

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'customer' | 'review' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  metadata?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const generateNotifications = useCallback(async (): Promise<Notification[]> => {
    const notifs: Notification[] = [];

    try {
      // Fetch recent orders for order notifications
      const ordersResponse = await adminAPI.orders.getAll({ page: 1, limit: 5 });
      const recentOrders = ordersResponse.orders.slice(0, 3);

      recentOrders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const hoursDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));

        if (hoursDiff < 24) {
          notifs.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'New Order',
            message: `Order #${order.id.slice(0, 8)} received - ৳${order.totalAmount}`,
            timestamp: orderDate,
            read: false,
            link: `/admin/orders`,
            metadata: { orderId: order.id }
          });
        }
      });

      // Fetch products for stock notifications
      const productsResponse = await adminAPI.products.getAll({ page: 1, limit: 50 });
      const lowStockProducts = productsResponse.products.filter((p: any) => p.stock < 10 && p.stock > 0);

      if (lowStockProducts.length > 0) {
        const product = lowStockProducts[0];
        notifs.push({
          id: `stock-${product.id}`,
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${product.name} has only ${product.stock} units left`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          link: `/admin/products`,
          metadata: { productId: product.id }
        });
      }

      // Check for out of stock products
      const outOfStock = productsResponse.products.filter((p: any) => p.stock === 0);
      if (outOfStock.length > 0) {
        notifs.push({
          id: `stock-out-${outOfStock[0].id}`,
          type: 'stock',
          title: 'Out of Stock',
          message: `${outOfStock[0].name} is out of stock`,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          read: false,
          link: `/admin/inventory`,
          metadata: { productId: outOfStock[0].id }
        });
      }

      // System notification about total products
      if (productsResponse.pagination.total > 50) {
        notifs.push({
          id: 'system-inventory',
          type: 'system',
          title: 'Inventory Update',
          message: `You have ${productsResponse.pagination.total} products in your store`,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          read: true,
          link: `/admin/products`
        });
      }

    } catch (error) {
      console.error('Error generating notifications:', error);
    }

    // Sort by timestamp (newest first)
    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notifs = await generateNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [generateNotifications]);

  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
