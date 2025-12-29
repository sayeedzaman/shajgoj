import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Get all reviews for admin (with pagination, search, and filters)
export const getAllReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, rating } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Search filter (search in user name, email, product name, or comment)
    if (search) {
      where.OR = [
        {
          User: {
            OR: [
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          },
        },
        {
          Product: {
            name: { contains: search as string, mode: 'insensitive' },
          },
        },
        {
          comment: { contains: search as string, mode: 'insensitive' },
        },
      ];
    }

    // Rating filter
    if (rating) {
      where.rating = parseInt(rating as string);
    }

    // Fetch reviews with user and product details
    // Sort by rating DESC (highest first), then by createdAt DESC
    const reviews = await prisma.review.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: [
        { rating: 'desc' }, // Highest rating first
        { createdAt: 'desc' }, // Then newest first
      ],
      skip,
      take: limitNum,
    });

    const totalReviews = await prisma.review.count({ where });

    // Calculate statistics
    const stats = await calculateReviewStats();

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReviews / limitNum),
        total: totalReviews,
        hasNext: pageNum < Math.ceil(totalReviews / limitNum),
        hasPrev: pageNum > 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Get reviews for a specific product (public endpoint)
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort by rating DESC (highest first), then by createdAt DESC
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' }, // Highest rating first
        { createdAt: 'desc' }, // Then newest first
      ],
      skip,
      take: limitNum,
    });

    const totalReviews = await prisma.review.count({ where: { productId } });

    // Calculate product-specific stats
    const productStats = await calculateProductReviewStats(productId);

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalReviews / limitNum),
        total: totalReviews,
        hasNext: pageNum < Math.ceil(totalReviews / limitNum),
        hasPrev: pageNum > 1,
      },
      statistics: productStats,
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Failed to fetch product reviews' });
  }
};

// Create a review (authenticated users only)
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!productId || !rating) {
      res.status(400).json({ error: 'Product ID and rating are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      res.status(400).json({ error: 'You have already reviewed this product' });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment: comment || null,
        updatedAt: new Date(),
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
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// Update a review (authenticated users can only update their own reviews)
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!reviewId) {
      res.status(400).json({ error: 'Review ID is required' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Valid rating (1-5) is required' });
      return;
    }

    // Check if review exists and belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (existingReview.userId !== userId) {
      res.status(403).json({ error: 'You can only update your own reviews' });
      return;
    }

    // Update the review
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || null,
        updatedAt: new Date(),
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
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete a review (admin or review owner)
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!reviewId) {
      res.status(400).json({ error: 'Review ID is required' });
      return;
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Allow deletion if user is admin or review owner
    if (userRole !== 'ADMIN' && existingReview.userId !== userId) {
      res.status(403).json({ error: 'You can only delete your own reviews' });
      return;
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// Get user's own reviews (authenticated)
export const getUserReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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
      orderBy: [
        { rating: 'desc' }, // Highest rating first
        { createdAt: 'desc' }, // Then newest first
      ],
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
};

// Helper function to calculate overall review statistics
async function calculateReviewStats() {
  const totalReviews = await prisma.review.count();

  const ratingCounts = await prisma.review.groupBy({
    by: ['rating'],
    _count: {
      rating: true,
    },
  });

  const ratingSum = await prisma.review.aggregate({
    _sum: {
      rating: true,
    },
  });

  const averageRating = totalReviews > 0 ? (ratingSum._sum.rating || 0) / totalReviews : 0;

  const stats: any = {
    totalReviews,
    averageRating: parseFloat(averageRating.toFixed(2)),
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStars: 0,
  };

  ratingCounts.forEach((item) => {
    switch (item.rating) {
      case 5:
        stats.fiveStars = item._count.rating;
        break;
      case 4:
        stats.fourStars = item._count.rating;
        break;
      case 3:
        stats.threeStars = item._count.rating;
        break;
      case 2:
        stats.twoStars = item._count.rating;
        break;
      case 1:
        stats.oneStars = item._count.rating;
        break;
    }
  });

  return stats;
}

// Helper function to calculate product-specific review statistics
async function calculateProductReviewStats(productId: string) {
  const totalReviews = await prisma.review.count({ where: { productId } });

  const ratingCounts = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId },
    _count: {
      rating: true,
    },
  });

  const ratingSum = await prisma.review.aggregate({
    where: { productId },
    _sum: {
      rating: true,
    },
  });

  const averageRating = totalReviews > 0 ? (ratingSum._sum.rating || 0) / totalReviews : 0;

  const ratingDistribution: any = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  ratingCounts.forEach((item) => {
    ratingDistribution[item.rating] = item._count.rating;
  });

  return {
    totalReviews,
    averageRating: parseFloat(averageRating.toFixed(2)),
    ratingDistribution,
  };
}
