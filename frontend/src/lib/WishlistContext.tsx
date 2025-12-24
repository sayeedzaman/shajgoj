'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from '@/src/types/index';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

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

interface WishlistItemResponse {
  Product: Product & {
    Category: {
      id: string;
      name: string;
      slug: string;
    };
    Brand: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Fetch wishlist from backend
  const refreshWishlist = useCallback(async () => {
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
        const products = data.items.map((item: WishlistItemResponse) => ({
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
  }, [user, apiUrl]);

  // Load wishlist on mount and when user changes
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Save to localStorage when wishlist changes (for guest users)
  useEffect(() => {
    if (!user && wishlist.length > 0) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const addToWishlist = async (product: Product) => {
    const token = localStorage.getItem('token');

    // ⚡ OPTIMISTIC UPDATE - Update UI immediately for instant feedback
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev; // Already in wishlist
      }
      return [...prev, product];
    });

    // Use localStorage if no user OR no token
    if (!user || !token) {
      // Guest user - persist to localStorage
      localStorage.setItem('wishlist', JSON.stringify([...wishlist, product]));
      return;
    }

    // Logged in user - sync with backend API in background
    try {
      const response = await fetch(`${apiUrl}/api/wishlist/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product.id }),
      });

      if (response.ok) {
        // Sync with server response
        const data = await response.json();
        const products = data.items.map((item: WishlistItemResponse) => ({
          ...item.Product,
          Category: item.Product.Category,
          Brand: item.Product.Brand,
        }));
        setWishlist(products);
        showToast('Added to wishlist!', 'success');
      } else {
        // Revert optimistic update on error
        setWishlist((prev) => prev.filter((item) => item.id !== product.id));

        const error = await response.json();
        console.error('Failed to add to wishlist:', error);
        showToast('Failed to add to wishlist', 'error');

        // If unauthorized, fallback to localStorage
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
      }
    } catch (error) {
      // Revert optimistic update on network error
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      console.error('Error adding to wishlist:', error);
      showToast('Failed to add to wishlist', 'error');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    const token = localStorage.getItem('token');

    // Store item for potential rollback
    const removedItem = wishlist.find((item) => item.id === productId);

    // ⚡ OPTIMISTIC UPDATE - Remove immediately
    setWishlist((prev) => prev.filter((item) => item.id !== productId));

    // Use localStorage if no user OR no token
    if (!user || !token) {
      // Guest user - persist to localStorage
      const newWishlist = wishlist.filter((item) => item.id !== productId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return;
    }

    // Logged in user - sync with backend API in background
    try {
      const response = await fetch(`${apiUrl}/api/wishlist/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Sync with server response
        const data = await response.json();
        const products = data.items.map((item: WishlistItemResponse) => ({
          ...item.Product,
          Category: item.Product.Category,
          Brand: item.Product.Brand,
        }));
        setWishlist(products);
        showToast('Removed from wishlist', 'success');
      } else {
        // Revert optimistic update on error
        if (removedItem) {
          setWishlist((prev) => [...prev, removedItem]);
        }
        console.error('Failed to remove from wishlist');
        showToast('Failed to remove from wishlist', 'error');
      }
    } catch (error) {
      // Revert optimistic update on network error
      if (removedItem) {
        setWishlist((prev) => [...prev, removedItem]);
      }
      console.error('Error removing from wishlist:', error);
      showToast('Failed to remove from wishlist', 'error');
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = async () => {
    const token = localStorage.getItem('token');

    // Use localStorage if no user OR no token
    if (!user || !token) {
      // Guest user - clear localStorage
      setWishlist([]);
      localStorage.removeItem('wishlist');
      return;
    }

    // Logged in user - use backend API
    try {
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
