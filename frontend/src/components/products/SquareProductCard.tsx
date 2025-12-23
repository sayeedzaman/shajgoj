'use client';

import Link from 'next/link';
import { Product } from '@/src/types/index';
import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/src/lib/CartContext';

interface SquareProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export default function SquareProductCard({
  product,
  showAddToCart = true,
}: SquareProductCardProps) {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group bg-white rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      {/* Square Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Large Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-20">
            <div className="bg-red-500 text-white rounded-lg shadow-lg">
              <div className="px-3 py-2 text-center">
                <div className="text-2xl font-bold leading-none">{discountPercent}%</div>
                <div className="text-xs font-semibold mt-0.5">OFF</div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-lg transition-all z-20 group/wishlist"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-5 h-5 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            } group-hover/wishlist:scale-110 transition-transform`}
          />
        </button>

        {/* Product Image */}
        <div className="w-full h-full flex items-center justify-center p-6">
          {product.imageUrl || product.images?.[0] ? (
            <img
              src={product.imageUrl || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <svg
                className="w-24 h-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm mt-2">No image</span>
            </div>
          )}
        </div>

        {/* Hover Overlay with Add to Cart */}
        {showAddToCart && product.stock > 0 && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 z-10">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full bg-white text-red-600 py-3 px-6 rounded-lg hover:bg-red-600 hover:text-white transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl transform group-hover:scale-105"
            >
              {isAddingToCart ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
            <div className="text-center">
              <span className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
                Out of Stock
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.Brand && (
          <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">
            {product.Brand.name}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 min-h-12 group-hover:text-red-600 transition-colors leading-snug">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-2xl font-bold text-red-600">
            ৳{displayPrice.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-base text-gray-400 line-through font-medium">
              ৳{product.price.toFixed(0)}
            </span>
          )}
        </div>

        {/* Savings Amount */}
        {hasDiscount && (
          <p className="text-sm text-green-600 font-semibold mb-2">
            You save ৳{(product.price - product.salePrice!).toFixed(0)}
          </p>
        )}

        {/* Stock Status */}
        <div className="text-sm font-medium">
          {product.stock > 0 ? (
            product.stock <= 5 ? (
              <span className="text-orange-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
                Only {product.stock} left!
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                In Stock
              </span>
            )
          ) : (
            <span className="text-red-600 font-semibold">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
