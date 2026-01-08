'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Menu, User, Settings, LogOut, Home, X, Package, ShoppingCart, Users, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/src/lib/AuthContext';
import { useNotifications } from '@/src/lib/NotificationContext';
import { getAllConversations, type Conversation } from '@/src/lib/chatApi';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Poll for unread chat messages
  useEffect(() => {
    const loadUnreadChats = async () => {
      try {
        const conversations = await getAllConversations();
        const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
        setChatUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error loading unread chats:', error);
      }
    };

    if (user?.role === 'ADMIN') {
      loadUnreadChats();
      const interval = setInterval(loadUnreadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case 'stock':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'customer':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* View Website Button */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all font-medium text-sm"
          >
            <Home className="w-4 h-4" />
            <span>View Website</span>
          </Link>

          {/* Mobile Home Button */}
          <Link
            href="/"
            className="sm:hidden p-2 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all"
            title="View Website"
          >
            <Home className="w-5 h-5" />
          </Link>

          {/* Messenger */}
          <Link
            href="/admin/messages"
            className="relative p-2 hover:bg-gray-100 rounded-lg"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5 text-gray-600" />
            {chatUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {chatUnreadCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500">{unreadCount} unread</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    // Loading skeleton
                    <div className="space-y-0">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-100 animate-pulse">
                          <div className="flex items-start gap-3">
                            <div className="w-4 h-4 bg-gray-200 rounded mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-100 rounded w-full" />
                              <div className="h-3 bg-gray-100 rounded w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                {getTimeAgo(notification.timestamp)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName || 'Admin'} {user?.lastName || ''}
                </p>
                <p className="text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || 'Admin'} {user?.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <a
                    href="/admin/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </a>
                  <a
                    href="/admin/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </a>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>
    </header>
  );
}
