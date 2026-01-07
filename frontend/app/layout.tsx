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
import { useState, useEffect } from 'react';
import type { Category } from '@/src/types';
import { Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const { cart, isCartOpen, closeCart, updateCartItem, removeFromCart, isLoading } = useCart();
  const [footerCategories, setFooterCategories] = useState<Category[]>([]);

  // Fetch categories for footer
  useEffect(() => {
    const fetchFooterCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/categories`);
        if (!response.ok) return;

        const data = await response.json();
        const categoriesList = data.categories || [];

        // Sort categories alphabetically by name
        const sortedCategories = categoriesList.sort((a: Category, b: Category) =>
          a.name.localeCompare(b.name)
        );

        setFooterCategories(sortedCategories);
      } catch (error) {
        console.error('Failed to fetch footer categories:', error);
      }
    };

    if (!isAdminPage) {
      fetchFooterCategories();
    }
  }, [isAdminPage]);

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
                <p className="text-gray-400 text-sm mb-6">
                  Your trusted destination for authentic beauty products in Bangladesh.
                </p>

                {/* Social Media Icons */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-sm">Follow Us</h4>
                  <div className="flex gap-3">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-blue-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-sky-500 p-2 rounded-full transition-colors duration-200"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-red-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="YouTube"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                    <a
                      href="https://wa.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-green-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="WhatsApp"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                    <a
                      href="mailto:contact@khalisbeauty.com"
                      className="bg-gray-800 hover:bg-red-500 p-2 rounded-full transition-colors duration-200"
                      aria-label="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>
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
                  {footerCategories.length > 0 ? (
                    footerCategories.slice(0, 8).map((category) => (
                      <li key={category.id}>
                        <Link href={`/category/${category.slug}`} className="hover:text-white">
                          {category.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <>
                      <li><Link href="/category/makeup" className="hover:text-white">Makeup</Link></li>
                      <li><Link href="/category/skin" className="hover:text-white">Skin Care</Link></li>
                      <li><Link href="/category/hair" className="hover:text-white">Hair Care</Link></li>
                      <li><Link href="/category/men" className="hover:text-white">Men</Link></li>
                    </>
                  )}
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
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
