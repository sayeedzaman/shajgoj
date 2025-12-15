'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
        <BarChart3 className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
      <p className="text-gray-600 max-w-md">
        Analytics and reporting page is coming soon. View detailed insights about your sales, customers, and business performance.
      </p>
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can aggregate order data and create comprehensive analytics dashboards.
        </p>
      </div>
    </div>
  );
}
