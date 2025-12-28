'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { concernsAPI } from '@/src/lib/api';
import { Concern } from '@/src/types/index';
import { ChevronRight } from 'lucide-react';

export default function ShopByConcernPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConcerns();
  }, []);

  const fetchConcerns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await concernsAPI.getAll();
      setConcerns(data);
    } catch (error) {
      console.error('Error fetching concerns:', error);
      setError('Failed to load concerns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-red-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Shop by Concern</span>
        </nav>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shop by Concern</h1>
          <p className="text-gray-600 max-w-2xl">
            Find the perfect products tailored to your specific skincare and haircare needs
          </p>
        </div>

        {/* Concerns Grid */}
        {error ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchConcerns}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : concerns.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {concerns.map((concern) => (
                <Link
                  key={concern.id}
                  href={`/concerns/${concern.slug}`}
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-red-500 p-6 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="text-center">
                    {/* Icon based on concern name */}
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-purple-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {getConcernEmoji(concern.name)}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                      {concern.name}
                    </h3>
                    <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                      View products
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-12 bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Why Shop by Concern?
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Targeted Solutions</h3>
                  <p className="text-sm text-gray-600">
                    Find products specifically designed to address your unique concerns
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-3">⏱️</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Save Time</h3>
                  <p className="text-sm text-gray-600">
                    No more browsing through hundreds of products - get exactly what you need
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-3">✨</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Better Results</h3>
                  <p className="text-sm text-gray-600">
                    Products curated for specific concerns deliver more effective results
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No concerns available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get emoji for each concern
function getConcernEmoji(concernName: string): string {
  const emojiMap: Record<string, string> = {
    'Acne': '💊',
    'Anti-Aging': '⏰',
    'Dandruff': '❄️',
    'Dry Skin': '💧',
    'Hair Fall': '🍃',
    'Oil Control': '🧴',
    'Pore Care': '🔬',
    'Hyperpigmentation': '☀️',
    'Hair Thinning': '💆',
    'Sun Protection': '🌞',
  };
  return emojiMap[concernName] || '✨';
}
