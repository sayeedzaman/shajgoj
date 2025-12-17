'use client';

import { useCart } from '@/src/lib/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EmptyState from '@/src/components/common/EmptyState';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartItem, removeFromCart, isLoading } = useCart();

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal > 500 ? 0 : 60; // Free shipping over ৳500
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added any products to your cart yet. Start shopping to fill it up!"
            actionLabel="Browse Products"
            actionHref="/products"
            icon={<ShoppingBag className="w-10 h-10 text-gray-400" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{cart?.itemCount || 0} items in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header - Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const displayPrice = item.product.salePrice || item.product.price;
                  const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;
                  const itemTotal = displayPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Product Info */}
                        <div className="col-span-12 md:col-span-6 flex gap-4">
                          {/* Image */}
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="w-24 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 hover:border-red-500 transition-colors"
                          >
                            {item.product.imageUrl || item.product.images?.[0] ? (
                              <img
                                src={item.product.imageUrl || item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ShoppingBag className="w-10 h-10" />
                              </div>
                            )}
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="text-base font-semibold text-gray-900 hover:text-red-600 line-clamp-2 block mb-1"
                            >
                              {item.product.name}
                            </Link>
                            {item.product.brand && (
                              <p className="text-sm text-gray-500 mb-2">
                                {item.product.brand.name}
                              </p>
                            )}
                            {item.product.stock < 10 && item.product.stock > 0 && (
                              <p className="text-xs text-orange-600 font-medium">
                                Only {item.product.stock} left in stock
                              </p>
                            )}
                            {item.product.stock === 0 && (
                              <p className="text-xs text-red-600 font-medium">
                                Out of stock
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-4 md:col-span-2 md:text-center">
                          <div className="flex md:flex-col md:items-center gap-2">
                            <span className="md:hidden text-sm text-gray-600">Price:</span>
                            <div>
                              <span className="text-base font-bold text-red-600">
                                ৳{displayPrice.toFixed(0)}
                              </span>
                              {hasDiscount && (
                                <span className="block text-sm text-gray-400 line-through">
                                  ৳{item.product.price.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="col-span-4 md:col-span-2 md:text-center">
                          <div className="flex items-center gap-2 md:justify-center">
                            <span className="md:hidden text-sm text-gray-600">Quantity:</span>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                              <button
                                onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                                disabled={isLoading || item.quantity <= 1}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-base font-medium min-w-[32px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                                disabled={isLoading || item.quantity >= item.product.stock}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="col-span-4 md:col-span-2 md:text-right flex md:flex-col items-center md:items-end justify-between">
                          <span className="md:hidden text-sm text-gray-600">Total:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">
                              ৳{itemTotal.toFixed(0)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">৳{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `৳${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {subtotal < 500 && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Add ৳{(500 - subtotal).toFixed(0)} more to get FREE shipping!
                  </p>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-red-600">৳{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 group"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Taxes calculated at checkout
              </p>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Easy returns</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Authentic products</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
