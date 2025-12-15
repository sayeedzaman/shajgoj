'use client';

import React from 'react';
import { Package } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders Management</h1>
      <p className="text-gray-600 max-w-md">
        Orders management page is coming soon. This page will allow you to view, process, and manage customer orders.
      </p>
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can add orders management features connected to your backend Order API endpoints.
        </p>
      </div>
    </div>
  );
}
