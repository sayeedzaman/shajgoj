'use client';

import { X, Trash2, ShoppingCart, Heart } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/src/types/index';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export default function WishlistSidebar({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  isLoading = false,
}: WishlistSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white/30 backdrop-blur-md z-40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600 fill-red-600" />
              Wishlist ({wishlist.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          {wishlist.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Wishlist is Empty
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Save your favorite products to your wishlist!
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Wishlist Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {wishlist.map((product) => {
                    const displayPrice = product.salePrice || product.price;
                    const hasDiscount = product.salePrice && product.salePrice < product.price;

                    return (
                      <div
                        key={product.id}
                        className="flex gap-3 bg-gray-50 rounded-lg p-3"
                      >
                        {/* Product Image */}
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={onClose}
                          className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0"
                        >
                          {product.imageUrl || product.images?.[0] ? (
                            <img
                              src={product.imageUrl || product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Heart className="w-8 h-8" />
                            </div>
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                            className="text-sm font-medium text-gray-900 hover:text-red-600 line-clamp-2 block mb-1"
                          >
                            {product.name}
                          </Link>

                          {product.Brand && (
                            <p className="text-xs text-gray-500 mb-2">
                              {product.Brand.name}
                            </p>
                          )}

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-red-600">
                              ৳{displayPrice.toFixed(0)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ৳{product.price.toFixed(0)}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onAddToCart(product)}
                              disabled={isLoading || product.stock === 0}
                              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                                product.stock === 0
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button
                              onClick={() => onRemoveFromWishlist(product.id)}
                              disabled={isLoading}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 space-y-3">
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="block w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-center"
                >
                  View Full Wishlist
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
