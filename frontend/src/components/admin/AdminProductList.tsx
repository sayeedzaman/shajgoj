'use client';

import React, { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export default function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (err) {
      setError((err as Error).message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete');
      // refresh
      fetchProducts();
    } catch (err) {
      alert((err as Error).message || 'Error deleting product');
    }
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Products</h2>
        <button
          onClick={() => alert('Add product flow not implemented in demo')}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          + Add
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-sm text-gray-500">No products found.</div>
      ) : (
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="pb-2">Name</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2">{p.name}</td>
                <td className="py-2">৳{p.price}</td>
                <td className="py-2">{p.stock}</td>
                <td className="py-2">
                  <button
                    onClick={() => alert('Edit not implemented in demo')}
                    className="mr-2 text-sm text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
