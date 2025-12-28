'use client';

import Link from 'next/link';
import { Product } from '@/src/types/index';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/src/lib/CartContext';
import { useWishlist } from '@/src/lib/WishlistContext';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ProductCard({
  product,
  showAddToCart = true,
}: ProductCardProps) {
  const { addToCart, isLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  // Fetch review stats for this product
  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/products/${product.id}`);
        if (response.ok) {
          const data = await response.json();
          setReviewStats({
            averageRating: data.stats?.averageRating || 0,
            totalReviews: data.stats?.totalReviews || 0
          });
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };

    fetchReviewStats();
  }, [product.id]);

  const rating = reviewStats.averageRating;
  const reviewCount = reviewStats.totalReviews;

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
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
      className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Badges */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            -{discountPercent}%
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 right-2 bg-linear-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
            Featured
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 ${product.featured ? (hasDiscount ? 'left-16' : 'left-2') : 'right-2'} w-8 h-8 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10 group/wishlist flex items-center justify-center`}
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} group-hover/wishlist:scale-110 transition-transform`}
          />
        </button>

        {/* Product Image */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {product.imageUrl || product.images?.[0] ? (
            <img
              src={product.imageUrl || product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300">
              <svg
                className="w-20 h-20"
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
              <span className="text-xs mt-2">No image</span>
            </div>
          )}
        </div>

        {/* Quick Add to Cart Overlay */}
        {showAddToCart && product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex items-end justify-center">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full bg-white text-red-600 py-2 px-4 rounded-md hover:bg-red-600 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAddingToCart ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  <ShoppingCart className="w-4 h-4" />
                  Quick Add
                </>
              )}
            </button>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="bg-gray-900 text-white px-4 py-2 rounded-md font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brand */}
        {product.Brand && (
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">
            {product.Brand.name}
          </p>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 min-h-10 group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {reviewCount > 0 ? (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-gray-400">No reviews yet</span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center gap-2 mb-2 mt-auto">
          <span className="text-lg font-bold text-red-600">
            ৳{displayPrice.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.price.toFixed(0)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="text-xs">
          {product.stock > 0 ? (
            product.stock <= 5 ? (
              <span className="text-orange-600 font-medium">
                Only {product.stock} left!
              </span>
            ) : (
              <span className="text-green-600">In Stock</span>
            )
          ) : (
            <span className="text-red-600 font-medium">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}
