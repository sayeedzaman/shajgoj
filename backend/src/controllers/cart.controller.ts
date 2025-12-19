import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Helper: Build cart response for a user
const buildCartForUser = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      CartItem: {
        include: {
          Product: {
            include: {
              Category: {
                select: { id: true, name: true, slug: true },
              },
              Brand: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Category: { select: { id: true, name: true, slug: true } },
                Brand: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });
  }

  const items = cart.CartItem.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    cartId: item.cartId,
    productId: item.productId,
    product: {
      ...item.Product,
      imageUrl: item.Product.images.length > 0 ? item.Product.images[0] : null,
      category: item.Product.Category,
      brand: item.Product.Brand,
    },
  }));

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: parseFloat(subtotal.toFixed(2)),
  };
};

// Get user's cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        CartItem: {
          include: {
            Product: {
              include: {
                Category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                Brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // If cart doesn't exist, create it
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
        },
        include: {
          cartItems: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    const cartData = await buildCartForUser(userId);
    res.json(cartData);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (qty < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${product.stock} items available`,
      });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    let cartItem;

    if (existingCartItem) {
      // Update quantity if item exists
      const newQuantity = existingCartItem.quantity + qty;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          error: `Cannot add more items. Only ${product.stock} items available`,
        });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              brand: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: qty,
        },
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              brand: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
    }

    // Transform response
    const transformedItem = {
      id: cartItem.id,
      quantity: cartItem.quantity,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      product: {
        ...cartItem.Product,
        imageUrl: cartItem.Product.images.length > 0 ? cartItem.Product.images[0] : null,
        category: cartItem.Product.Category,
        brand: cartItem.Product.Brand,
      },
    };

    const cartData = await buildCartForUser(userId);
    res.status(201).json(cartData);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!itemId) {
      return res.status(400).json({ error: 'Cart item ID is required' });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    // Find cart item and verify it belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        Cart: true,
        Product: true,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.Cart.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check stock availability
    if (cartItem.Product.stock < quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${cartItem.Product.stock} items available`,
      });
    }

    // Update cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parseInt(quantity) },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Transform response
    const transformedItem = {
      id: updatedCartItem.id,
      quantity: updatedCartItem.quantity,
      cartId: updatedCartItem.cartId,
      productId: updatedCartItem.productId,
      product: {
        ...updatedCartItem.Product,
        imageUrl: updatedCartItem.Product.images.length > 0 ? updatedCartItem.Product.images[0] : null,
        category: updatedCartItem.Product.Category,
        brand: updatedCartItem.Product.Brand,
      },
    };

    const cartData = await buildCartForUser(userId);
    res.json(cartData);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!itemId) {
      return res.status(400).json({ error: 'Cart item ID is required' });
    }

    // Find cart item and verify it belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        Cart: true,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.Cart.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const cartData = await buildCartForUser(userId);
    res.json(cartData);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};