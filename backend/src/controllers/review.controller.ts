import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

// Get all reviews for a product (Public)
export const getProductReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    // Get reviews with user info - sorted by rating only (high to low)
    const reviews = await prisma.review.findMany({
      where: productId ? { productId } : {},
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Get total count
    const totalReviews = await prisma.review.count({
      where: productId ? { productId } : {},
    });

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: productId ? { productId } : {},
      _avg: {
        rating: true,
      },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: productId ? { productId } : {},
      _count: {
        rating: true,
      },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      if (item._count && typeof item._count.rating === 'number') {
        distribution[item.rating as keyof typeof distribution] = item._count.rating;
      }
    });

    res.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
          id: review.User.id,
          name: review.User.firstName && review.User.lastName
            ? `${review.User.firstName} ${review.User.lastName}`
            : review.User.email.split('@')[0],
        },
      })),
      stats: {
        averageRating: avgRating._avg?.rating || 0,
        totalReviews,
        distribution,
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Create a review (Authenticated users only)
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId, rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Optional: Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        Order: {
          userId,
          status: { in: ['DELIVERED', 'SHIPPED'] },
        },
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        error: 'You can only review products you have purchased'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating),
        comment: comment || null,
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          id: review.User.id,
          name: review.User.firstName && review.User.lastName
            ? `${review.User.firstName} ${review.User.lastName}`
            : review.User.email.split('@')[0],
        },
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// Update own review
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reviewId) {
      return res.status(400).json({ error: 'Review ID is required' });
    }

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating: parseInt(rating) }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }) as any;

    res.json({
      message: 'Review updated successfully',
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
        user: {
          id: updatedReview.User.id,
          name: updatedReview.User.firstName && updatedReview.User.lastName
            ? `${updatedReview.User.firstName} ${updatedReview.User.lastName}`
            : updatedReview.User.email.split('@')[0],
        },
      },
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete own review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reviewId) {
      return res.status(400).json({ error: 'Review ID is required' });
    }

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Get user's own reviews
export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        product: {
          id: review.Product.id,
          name: review.Product.name,
          slug: review.Product.slug,
          imageUrl: review.Product.images.length > 0 ? review.Product.images[0] : null,
        },
      })),
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Admin: Get all reviews with filters
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', rating, productId, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filters
    const where: any = {};

    if (rating) {
      where.rating = parseInt(rating as string);
    }

    if (productId) {
      where.productId = productId as string;
    }

    if (search) {
      where.OR = [
        { comment: { contains: search as string, mode: 'insensitive' } },
        { User: { email: { contains: search as string, mode: 'insensitive' } } },
        { User: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { User: { lastName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalReviews = await prisma.review.count({ where });

    res.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: {
          id: review.User.id,
          email: review.User.email,
          name: review.User.firstName && review.User.lastName
            ? `${review.User.firstName} ${review.User.lastName}`
            : review.User.email.split('@')[0],
        },
        product: {
          id: review.Product.id,
          name: review.Product.name,
          slug: review.Product.slug,
          imageUrl: review.Product.images.length > 0 ? review.Product.images[0] : null,
        },
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Admin: Delete any review
export const adminDeleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({ error: 'Review ID is required' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Get review statistics (for dashboard)
export const getReviewStats = async (req: AuthRequest, res: Response) => {
  try {
    // Total reviews
    const totalReviews = await prisma.review.count();

    // Average rating across all products
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    });

    // Rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    });

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    // Recent reviews (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReviews = await prisma.review.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Top rated products
    const topRatedProducts = await prisma.review.groupBy({
      by: ['productId'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      having: {
        rating: {
          _count: {
            gte: 5, // At least 5 reviews
          },
        },
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: 5,
    });

    // Get product details for top rated
    const topRatedWithDetails = await Promise.all(
      topRatedProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        });
        return {
          product,
          averageRating: item._avg.rating,
          reviewCount: item._count.rating,
        };
      })
    );

    res.json({
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      recentReviews,
      distribution,
      topRatedProducts: topRatedWithDetails,
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
};
