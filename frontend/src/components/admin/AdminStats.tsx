'use client';

import React, { useEffect, useState } from 'react';

export default function AdminStats() {
  const [stats, setStats] = useState<{ totalProducts?: number; lowStock?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/products/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        // Example return: { totalProducts: number, lowStock: number }
        setStats(data);
      } catch (err) {
        setError((err as Error).message || 'Error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-4 bg-white rounded shadow-sm border">
        <h3 className="text-sm text-gray-500">Total Products</h3>
        <p className="text-2xl font-semibold">{stats?.totalProducts ?? '—'}</p>
      </div>
      <div className="p-4 bg-white rounded shadow-sm border">
        <h3 className="text-sm text-gray-500">Low Stock Items</h3>
        <p className="text-2xl font-semibold">{stats?.lowStock ?? '—'}</p>
      </div>
    </div>
  );
}
