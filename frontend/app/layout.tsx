'use client';

import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '@/src/lib/AuthContext';
import { CartProvider, useCart } from '@/src/lib/CartContext';
import { WishlistProvider } from '@/src/lib/WishlistContext';
import { ToastProvider } from '@/src/lib/ToastContext';
import Navbar from '@/src/components/layout/Navbar';
import CartSidebar from '@/src/components/cart/CartSidebar';
import { usePathname } from 'next/navigation';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const { cart, isCartOpen, closeCart, updateCartItem, removeFromCart, isLoading } = useCart();

  return (
    <>
      {!isAdminPage && <Navbar />}

      {/* Cart Sidebar */}
      {!isAdminPage && (
        <CartSidebar
          key={JSON.stringify(cart?.items.map(i => ({ id: i.id, qty: i.quantity })) || [])}
          isOpen={isCartOpen}
          onClose={closeCart}
          cartItems={cart?.items || []}
          onUpdateQuantity={updateCartItem}
          onRemoveItem={removeFromCart}
          isLoading={isLoading}
        />
      )}

      <main className={isAdminPage ? '' : 'min-h-screen'}>{children}</main>

      {!isAdminPage && (
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 gradient-text">Khali&apos;s Beauty</h3>
                <p className="text-gray-400 text-sm">
                  Your trusted destination for authentic beauty products in Bangladesh.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/shipping" className="hover:text-white">Shipping</Link></li>
                  <li><Link href="/returns" className="hover:text-white">Returns</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Categories</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/category/makeup" className="hover:text-white">Makeup</Link></li>
                  <li><Link href="/category/skin" className="hover:text-white">Skin Care</Link></li>
                  <li><Link href="/category/hair" className="hover:text-white">Hair Care</Link></li>
                  <li><Link href="/category/men" className="hover:text-white">Men</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Customer Service</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/faqs" className="hover:text-white">FAQs</Link></li>
                  <li><Link href="/track-order" className="hover:text-white">Track Order</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} Khali&apos;s Beauty. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartProvider>
                <LayoutContent>{children}</LayoutContent>
              </CartProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
