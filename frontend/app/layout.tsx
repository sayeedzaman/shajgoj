'use client';

import CartSidebar from '@/src/components/cart/CartSidebar';
import ChatWidget from '@/src/components/chat/ChatWidget';
import Navbar from '@/src/components/layout/Navbar';
import { AuthProvider } from '@/src/lib/AuthContext';
import { CartProvider, useCart } from '@/src/lib/CartContext';
import { ReviewStatsProvider } from '@/src/lib/ReviewStatsContext';
import { ToastProvider } from '@/src/lib/ToastContext';
import { WishlistProvider } from '@/src/lib/WishlistContext';
import { brand, brandDescription } from '@/src/config/brand';
import type { Category } from '@/src/types';
import { Facebook, Instagram, Mail, MessageCircle, Phone, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import './globals.css';

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

      {/* Chat Widget for users */}
      {!isAdminPage && <ChatWidget />}

      {!isAdminPage && (
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-pink-500">{brand.name}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {brandDescription}
                </p>
                <a href={`tel:${brand.phone}`} className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                  <Phone className="h-4 w-4" />
                  {brand.phoneDisplay}
                </a>

                {/* Social Media Icons */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-sm">Follow Us</h4>
                  <div className="flex gap-3">
                    <a
                      href={brand.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-blue-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                    {brand.social.instagram ? (
                      <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors duration-200" aria-label="Instagram">
                        <Instagram className="h-5 w-5" />
                      </a>
                    ) : (
                      <span className="bg-gray-800/50 text-gray-600 p-2 rounded-full" aria-label="Instagram unavailable">
                        <Instagram className="h-5 w-5" />
                      </span>
                    )}
                    {brand.social.twitter ? (
                      <a href={brand.social.twitter} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-sky-500 p-2 rounded-full transition-colors duration-200" aria-label="Twitter">
                        <Twitter className="h-5 w-5" />
                      </a>
                    ) : (
                      <span className="bg-gray-800/50 text-gray-600 p-2 rounded-full" aria-label="Twitter unavailable">
                        <Twitter className="h-5 w-5" />
                      </span>
                    )}
                    {brand.social.youtube ? (
                      <a href={brand.social.youtube} target="_blank" rel="noopener noreferrer" className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors duration-200" aria-label="YouTube">
                        <Youtube className="h-5 w-5" />
                      </a>
                    ) : (
                      <span className="bg-gray-800/50 text-gray-600 p-2 rounded-full" aria-label="YouTube unavailable">
                        <Youtube className="h-5 w-5" />
                      </span>
                    )}
                    <a
                      href={brand.social.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-green-600 p-2 rounded-full transition-colors duration-200"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                    {brand.email ? (
                      <a href={`mailto:${brand.email}`} className="bg-gray-800 hover:bg-pink-500 p-2 rounded-full transition-colors duration-200" aria-label="Email">
                        <Mail className="h-5 w-5" />
                      </a>
                    ) : (
                      <span className="bg-gray-800/50 text-gray-600 p-2 rounded-full" aria-label="Email unavailable">
                        <Mail className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>About Us</li>
                  <li>Contact</li>
                  <li>Shipping</li>
                  <li>Returns</li>
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
                  <li>FAQs</li>
                  <li>Track Order</li>
                  <li>Terms &amp; Conditions</li>
                  <li>Privacy Policy</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
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
        <title>{brand.name}</title>
        <meta name="description" content={brandDescription} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartProvider>
                <ReviewStatsProvider>
                  <LayoutContent>{children}</LayoutContent>
                </ReviewStatsProvider>
              </CartProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
