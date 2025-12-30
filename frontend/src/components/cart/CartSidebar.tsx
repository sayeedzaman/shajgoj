'use client';

import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { CartItem } from '@/src/types/index';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  isLoading?: boolean;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  isLoading = false,
}: CartSidebarProps) {
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shopping Cart ({itemCount})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Add some products to get started!
                </p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {cartItems.map((item) => {
                  const displayPrice = item.product.salePrice || item.product.price;
                  const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 bg-gray-50 rounded-lg p-3 sm:p-4"
                    >
                      {/* Mobile/Desktop Layout Wrapper */}
                      <div className="flex gap-3 flex-1">
                        {/* Product Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          {item.product.imageUrl || item.product.images?.[0] ? (
                            <img
                              src={item.product.imageUrl || item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              onClick={onClose}
                              className="text-sm font-medium text-gray-900 hover:text-red-600 line-clamp-2 block mb-1"
                            >
                              {item.product.name}
                            </Link>

                            {item.product.brand && (
                              <p className="text-xs text-gray-500">
                                {item.product.brand.name}
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-red-600">
                              ৳{displayPrice.toFixed(0)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                ৳{item.product.price.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls & Remove Button */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={isLoading || item.quantity <= 1}
                            className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-medium min-w-[32px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isLoading || item.quantity >= item.product.stock}
                            className="p-1.5 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Item Total & Remove Button */}
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-gray-900">
                            ৳{(displayPrice * item.quantity).toFixed(0)}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            disabled={isLoading}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-4 sm:p-6 space-y-4 bg-white">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-lg sm:text-xl font-bold">
                <span className="text-gray-900">Subtotal:</span>
                <span className="text-red-600">৳{subtotal.toFixed(2)}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full py-3.5 bg-red-600 text-white text-center rounded-lg font-semibold hover:bg-red-700 transition-colors text-base"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full py-3.5 bg-gray-900 text-white text-center rounded-lg font-semibold hover:bg-gray-800 transition-colors text-base"
                >
                  Checkout
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                Shipping & taxes calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
