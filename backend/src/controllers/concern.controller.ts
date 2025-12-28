import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Get all concerns
export const getAllConcerns = async (req: Request, res: Response) => {
  try {
    const concerns = await prisma.concern.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json(concerns);
  } catch (error) {
    console.error('Get all concerns error:', error);
    res.status(500).json({ error: 'Failed to fetch concerns' });
  }
};

// Get single concern by ID or slug
export const getConcernById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Concern ID or slug is required' });
    }

    // Try to find by ID first, then by slug
    let concern = await prisma.concern.findUnique({
      where: { id },
    });

    // If not found by ID, try finding by slug
    if (!concern) {
      concern = await prisma.concern.findUnique({
        where: { slug: id },
      });
    }

    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    res.json(concern);
  } catch (error) {
    console.error('Get concern by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch concern' });
  }
};

// Search products by concern
export const searchByConcern = async (req: Request, res: Response) => {
  try {
    const {
      concernId,
      brandId,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '24',
    } = req.query;

    if (!concernId) {
      return res.status(400).json({ error: 'Concern ID is required' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause for filtering
    const where: any = {
      concernId: concernId as string,
    };

    if (brandId) {
      where.brandId = brandId as string;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
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
          Concern: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: order as 'asc' | 'desc',
        },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products to match frontend expectations
    const transformedProducts = products.map((product) => ({
      ...product,
      imageUrl: product.images.length > 0 ? product.images[0] : null,
    }));

    res.json({
      products: transformedProducts,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(totalCount / take),
        totalProducts: totalCount,
        hasMore: skip + take < totalCount,
      },
    });
  } catch (error) {
    console.error('Search by concern error:', error);
    res.status(500).json({ error: 'Failed to fetch products by concern' });
  }
};
