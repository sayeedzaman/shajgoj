'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/src/lib/AuthContext';
import { CartProvider, useCart } from '@/src/lib/CartContext';
import { WishlistProvider } from '@/src/lib/WishlistContext';
import { ToastProvider } from '@/src/lib/ToastContext';
import Navbar from '@/src/components/layout/Navbar';
import CartSidebar from '@/src/components/cart/CartSidebar';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

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
                  <li><a href="/about" className="hover:text-white">About Us</a></li>
                  <li><a href="/contact" className="hover:text-white">Contact</a></li>
                  <li><a href="/shipping" className="hover:text-white">Shipping</a></li>
                  <li><a href="/returns" className="hover:text-white">Returns</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Categories</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/category/makeup" className="hover:text-white">Makeup</a></li>
                  <li><a href="/category/skin" className="hover:text-white">Skin Care</a></li>
                  <li><a href="/category/hair" className="hover:text-white">Hair Care</a></li>
                  <li><a href="/category/men" className="hover:text-white">Men</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Customer Service</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/faqs" className="hover:text-white">FAQs</a></li>
                  <li><a href="/track-order" className="hover:text-white">Track Order</a></li>
                  <li><a href="/terms" className="hover:text-white">Terms & Conditions</a></li>
                  <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
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
      <body className={inter.className}>
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
