import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-500">404</h1>
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-32 h-32 text-gray-200" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-300 hover:border-red-500 hover:text-red-500 transition-colors"
          >
            <Search className="w-5 h-5" />
            Browse Products
          </Link>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Popular Categories</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/category/makeup"
              className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
            >
              Makeup
            </Link>
            <Link
              href="/category/skin"
              className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
            >
              Skin Care
            </Link>
            <Link
              href="/category/hair"
              className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
            >
              Hair Care
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
