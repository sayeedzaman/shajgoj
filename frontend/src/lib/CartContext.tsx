'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem } from '@/src/types/index';
import { cartAPI } from '@/src/lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isCartOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cartCount = cart?.itemCount || 0;

  // Fetch cart on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const refreshCart = useCallback(async () => {
    if (!user) return;

    try {
      const data = await cartAPI.get();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Don't show error to user for background refresh
    }
  }, [user]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      // Redirect to login or show message
      alert('Please login to add items to cart');
      return;
    }

    try {
      setIsLoading(true);
      const updatedCart = await cartAPI.addItem({ productId, quantity });
      setCart(updatedCart);
      openCart(); // Open cart sidebar after adding
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedCart = await cartAPI.updateItem(itemId, { quantity });
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update cart. Please try again.');
      // Refresh cart to get correct state
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedCart = await cartAPI.removeItem(itemId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item. Please try again.');
      // Refresh cart to get correct state
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isCartOpen,
        isLoading,
        openCart,
        closeCart,
        addToCart,
        updateCartItem,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
