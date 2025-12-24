'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/AuthContext';
import { NotificationProvider } from '@/src/lib/NotificationContext';
import AdminSidebar from '@/src/components/admin/AdminSidebar';
import AdminHeader from '@/src/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - Fixed on left side */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content wrapper - takes remaining space */}
        <div className="lg:pl-64">
          {/* Header - Fixed at top */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          </div>

          {/* Main content - scrollable */}
          <main className="min-h-screen p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
