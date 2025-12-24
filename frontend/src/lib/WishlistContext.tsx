'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/src/types/index';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch wishlist from backend
  const refreshWishlist = async () => {
    if (!user) {
      // If not logged in, try to load from localStorage
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (error) {
          console.error('Error loading wishlist from localStorage:', error);
          localStorage.removeItem('wishlist');
        }
      }
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.items.map((item: any) => ({
          ...item.Product,
          Category: item.Product.Category,
          Brand: item.Product.Brand,
        }));
        setWishlist(products);
      } else if (response.status === 401) {
        // Unauthorized - clear wishlist
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load wishlist on mount and when user changes
  useEffect(() => {
    refreshWishlist();
  }, [user]);

  // Save to localStorage when wishlist changes (for guest users)
  useEffect(() => {
    if (!user && wishlist.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const addToWishlist = async (product: Product) => {
    if (!user) {
      // Guest user - use localStorage
      setWishlist((prev) => {
        if (prev.some((item) => item.id === product.id)) {
          return prev;
        }
        const newWishlist = [...prev, product];
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        return newWishlist;
      });
      return;
    }

    // Logged in user - use backend API
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.items.map((item: any) => ({
          ...item.Product,
          Category: item.Product.Category,
          Brand: item.Product.Brand,
        }));
        setWishlist(products);
      } else {
        const error = await response.json();
        console.error('Failed to add to wishlist:', error);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) {
      // Guest user - use localStorage
      setWishlist((prev) => {
        const newWishlist = prev.filter((item) => item.id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        return newWishlist;
      });
      return;
    }

    // Logged in user - use backend API
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/wishlist/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.items.map((item: any) => ({
          ...item.Product,
          Category: item.Product.Category,
          Brand: item.Product.Brand,
        }));
        setWishlist(products);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = async () => {
    if (!user) {
      // Guest user - clear localStorage
      setWishlist([]);
      localStorage.removeItem('wishlist');
      return;
    }

    // Logged in user - use backend API
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/wishlist`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }
  };

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount,
        isLoading,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
