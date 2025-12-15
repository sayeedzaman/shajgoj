'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/AuthContext';
import AdminStats from '../../src/components/admin/AdminStats';
import AdminProductList from '../../src/components/admin/AdminProductList';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-sm text-gray-600 mb-8">Demo admin dashboard — server enforces admin-only access.</p>

      <section className="mb-8">
        <AdminStats />
      </section>

      <section>
        <AdminProductList />
      </section>
    </div>
  );
}
