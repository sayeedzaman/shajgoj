import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

// Get user's wishlist
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find or create wishlist for user
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        WishlistItem: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Create wishlist if it doesn't exist
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId,
          updatedAt: new Date(),
        },
        include: {
          WishlistItem: {
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
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    // Transform wishlist items to include imageUrl
    const transformedItems = wishlist!.WishlistItem.map((item) => ({
      ...item,
      Product: {
        ...item.Product,
        imageUrl: item.Product.images.length > 0 ? item.Product.images[0] : null,
      },
    }));

    res.json({
      id: wishlist!.id,
      items: transformedItems,
      itemCount: wishlist!.WishlistItem.length,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

// Add item to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId,
          updatedAt: new Date(),
        },
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existingItem) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    // Add item to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    // Get updated wishlist
    const updatedWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        WishlistItem: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const transformedItems = updatedWishlist!.WishlistItem.map((item) => ({
      ...item,
      Product: {
        ...item.Product,
        imageUrl: item.Product.images.length > 0 ? item.Product.images[0] : null,
      },
    }));

    res.json({
      id: updatedWishlist!.id,
      items: transformedItems,
      itemCount: updatedWishlist!.WishlistItem.length,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Failed to add item to wishlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Find wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Delete wishlist item
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    // Get updated wishlist
    const updatedWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        WishlistItem: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const transformedItems = updatedWishlist!.WishlistItem.map((item) => ({
      ...item,
      Product: {
        ...item.Product,
        imageUrl: item.Product.images.length > 0 ? item.Product.images[0] : null,
      },
    }));

    res.json({
      id: updatedWishlist!.id,
      items: transformedItems,
      itemCount: updatedWishlist!.WishlistItem.length,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
};

// Clear wishlist
export const clearWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    // Delete all wishlist items
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
      },
    });

    res.json({
      message: 'Wishlist cleared successfully',
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: 'Failed to clear wishlist' });
  }
};
