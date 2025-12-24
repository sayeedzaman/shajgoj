'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Heart, ArrowRight, X } from 'lucide-react';
import { useWishlist } from '@/src/lib/WishlistContext';
import { useCart } from '@/src/lib/CartContext';
import { Product } from '@/src/types/index';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeFromWishlist(productId);
      setRemovingId(null);
    }, 300);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleMoveAllToCart = async () => {
    try {
      for (const product of wishlist) {
        await addToCart(product.id, 1);
      }
      clearWishlist();
    } catch (error) {
      console.error('Error moving items to cart:', error);
    }
  };

  if (wishlistCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-8">
              Save your favorite products to your wishlist and shop them later!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-600 fill-red-600" />
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-2">
                {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleMoveAllToCart}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add All to Cart
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
                    clearWishlist();
                  }
                }}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 ${
                removingId === product.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                <Link href={`/products/${product.slug}`}>
                  <Image
                    src={product.imageUrl || product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors group"
                  aria-label="Remove from wishlist"
                >
                  <X className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>

                {/* Sale Badge */}
                {product.salePrice && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                    {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                  </div>
                )}

                {/* Stock Badge */}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                {/* Category & Brand */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  {product.Category && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {product.Category.name}
                    </span>
                  )}
                  {product.Brand && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {product.Brand.name}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-red-600">
                    ৳{(product.salePrice || product.price).toFixed(2)}
                  </span>
                  {product.salePrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ৳{product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      product.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
