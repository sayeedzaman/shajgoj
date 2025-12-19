'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Cart, CartItem, Product } from '@/src/types/index';
import { cartAPI, productsAPI } from '@/src/lib/api';
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
  clearCart: () => void;
}

// LocalStorage cart structure for guest users
interface LocalStorageCartItem {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'shajgoj_guest_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const cartCount = cart?.itemCount || 0;

  // Load guest cart from localStorage
  const loadGuestCart = useCallback(async () => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!storedCart) {
        setCart(null);
        return;
      }

      const localItems: LocalStorageCartItem[] = JSON.parse(storedCart);
      if (localItems.length === 0) {
        setCart(null);
        return;
      }

      // Fetch product details for all items
      const cartItems: CartItem[] = [];
      let subtotal = 0;
      let itemCount = 0;

      for (const item of localItems) {
        try {
          const product = await productsAPI.getById(item.productId);
          const price = product.salePrice || product.price;

          cartItems.push({
            id: `guest-${item.productId}`,
            quantity: item.quantity,
            product,
            cartId: 'guest-cart',
            productId: item.productId,
          });

          subtotal += price * item.quantity;
          itemCount += item.quantity;
        } catch (error) {
          console.error(`Failed to load product ${item.productId}:`, error);
        }
      }

      setCart({
        id: 'guest-cart',
        items: cartItems,
        itemCount,
        subtotal,
      });
    } catch (error) {
      console.error('Error loading guest cart:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      setCart(null);
    }
  }, []);

  // Save guest cart to localStorage
  const saveGuestCart = useCallback((items: CartItem[]) => {
    const localItems: LocalStorageCartItem[] = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItems));
  }, []);

  // Merge guest cart with server cart on login
  const mergeGuestCartWithServer = useCallback(async () => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (!storedCart) return;

      const localItems: LocalStorageCartItem[] = JSON.parse(storedCart);
      if (localItems.length === 0) return;

      setIsLoading(true);

      // Add each item from guest cart to server
      for (const item of localItems) {
        try {
          await cartAPI.addItem({
            productId: item.productId,
            quantity: item.quantity
          });
        } catch (error) {
          console.error(`Failed to merge item ${item.productId}:`, error);
        }
      }

      // Clear localStorage after successful merge
      localStorage.removeItem(CART_STORAGE_KEY);

      // Refresh cart to get merged data
      await refreshCart();
    } catch (error) {
      console.error('Error merging guest cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        // User is logged in - load from server and merge guest cart if exists
        await mergeGuestCartWithServer();
        await refreshCart();
      } else {
        // Guest user - load from localStorage
        await loadGuestCart();
      }
      setIsInitialized(true);
    };

    initializeCart();
  }, [user]);

  const refreshCart = useCallback(async () => {
    if (!user) {
      await loadGuestCart();
      return;
    }

    try {
      const data = await cartAPI.get();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }, [user, loadGuestCart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setIsLoading(true);

      if (user) {
        // Authenticated user - add to server cart
        const updatedCart = await cartAPI.addItem({ productId, quantity });
        setCart(updatedCart);
      } else {
        // Guest user - add to localStorage cart
        const product = await productsAPI.getById(productId);
        const price = product.salePrice || product.price;

        const currentItems = cart?.items || [];

        // Check if product already exists in cart
        const existingItemIndex = currentItems.findIndex(
          item => item.productId === productId
        );

        let updatedItems: CartItem[];
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedItems = [...currentItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
          };
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `guest-${productId}`,
            quantity,
            product,
            cartId: 'guest-cart',
            productId,
          };
          updatedItems = [...currentItems, newItem];
        }

        // Calculate totals
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedItems.reduce((sum, item) => {
          const itemPrice = item.product.salePrice || item.product.price;
          return sum + itemPrice * item.quantity;
        }, 0);

        const updatedCart: Cart = {
          id: 'guest-cart',
          items: updatedItems,
          itemCount,
          subtotal,
        };

        setCart(updatedCart);
        saveGuestCart(updatedItems);
      }

      openCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);

      if (user) {
        // Authenticated user - update server cart
        const updatedCart = await cartAPI.updateItem(itemId, { quantity });
        setCart(updatedCart);
      } else {
        // Guest user - update localStorage cart
        const currentItems = cart?.items || [];
        const updatedItems = currentItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        );

        // Calculate totals
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedItems.reduce((sum, item) => {
          const price = item.product.salePrice || item.product.price;
          return sum + price * item.quantity;
        }, 0);

        const updatedCart: Cart = {
          id: 'guest-cart',
          items: updatedItems,
          itemCount,
          subtotal,
        };

        setCart(updatedCart);
        saveGuestCart(updatedItems);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update cart. Please try again.');
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true);

      if (user) {
        // Authenticated user - remove from server cart
        const updatedCart = await cartAPI.removeItem(itemId);
        setCart(updatedCart);
      } else {
        // Guest user - remove from localStorage cart
        const currentItems = cart?.items || [];
        const updatedItems = currentItems.filter(item => item.id !== itemId);

        if (updatedItems.length === 0) {
          setCart(null);
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          // Calculate totals
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const subtotal = updatedItems.reduce((sum, item) => {
            const price = item.product.salePrice || item.product.price;
            return sum + price * item.quantity;
          }, 0);

          const updatedCart: Cart = {
            id: 'guest-cart',
            items: updatedItems,
            itemCount,
            subtotal,
          };

          setCart(updatedCart);
          saveGuestCart(updatedItems);
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item. Please try again.');
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setCart(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
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
        clearCart,
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
