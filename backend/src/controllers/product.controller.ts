import type{ Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Get all products with optional filtering
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      featured,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '12',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause for filtering
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (brandId) {
      where.brandId = brandId as string;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (featured === 'true') {
      where.featured = true;
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
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID or Slug
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID or slug is required' });
    }

    // Try to find by ID first, then by slug
    let product = await prisma.product.findUnique({
      where: { id },
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
        Review: {
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // If not found by ID, try finding by slug
    if (!product) {
      product = await prisma.product.findUnique({
        where: { slug: id },
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
          Review: {
            include: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
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

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate average rating
    const averageRating =
      product.Review.length > 0
        ? product.Review.reduce((sum, review) => sum + review.rating, 0) /
          product.Review.length
        : 0;

    const transformedProduct = {
      ...product,
      imageUrl: product.images.length > 0 ? product.images[0] : null,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: product.Review.length,
    };

    res.json(transformedProduct);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create new product (Admin only)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      images,
      featured,
      categoryId,
      brandId,
    } = req.body;

    // Validate required fields
    if (!name || !slug || !price || !categoryId) {
      return res.status(400).json({
        error: 'Missing required fields: name, slug, price, categoryId',
      });
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product slug already exists' });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if brand exists (if provided)
    if (brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        return res.status(404).json({ error: 'Brand not found' });
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: parseInt(stock) || 0,
        images: images || [],
        featured: featured === true || featured === 'true',
        categoryId,
        brandId: brandId || null,
      },
      include: {
        Category: true,
        Brand: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product (Admin only)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      images,
      featured,
      categoryId,
      brandId,
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If slug is being updated, check if it's already taken
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return res.status(400).json({ error: 'Product slug already exists' });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (salePrice !== undefined)
      updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (images) updateData.images = images;
    if (featured !== undefined)
      updateData.featured = featured === true || featured === 'true';
    if (categoryId) updateData.categoryId = categoryId;
    if (brandId !== undefined) updateData.brandId = brandId || null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        Category: true,
        Brand: true,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (this will cascade delete reviews and cart items due to Prisma relations)
    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get featured products based on latest uploads
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const { limit = '8' } = req.query;

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate today's start (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Step 1: Try to get products uploaded TODAY
    let products = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: todayStart, // Greater than or equal to today's start
        },
      },
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
      orderBy: {
        createdAt: 'desc', // Latest first
      },
      take: parseInt(limit as string),
    });

    let featuredReason = 'Uploaded today';

    // Step 2: If no products today, get products from last 7 days
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo, // Within last 7 days
          },
        },
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
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit as string),
      });
      featuredReason = 'Recent upload (last 7 days)';
    }

    // Step 3: If still no products, get the absolute latest products (no date filter)
    if (products.length === 0) {
      products = await prisma.product.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
        take: parseInt(limit as string),
      });
      featuredReason = 'Latest available';
    }

    const transformedProducts = products.map((product) => ({
      ...product,
      imageUrl: product.images.length > 0 ? product.images[0] : null,
      featuredReason,
    }));

    res.json(transformedProducts);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
};

// Get top selling products
export const getTopSellingProducts = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    // Step 1: Use Prisma groupBy to aggregate sales data
    const topSellingData = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        Order: {
          status: {
            in: ['DELIVERED', 'SHIPPED'], // Only count completed orders
          },
        },
      },
      _sum: {
        quantity: true, // Total units sold
      },
      _count: {
        id: true, // Number of times ordered
      },
      orderBy: {
        _sum: {
          quantity: 'desc', // Sort by most sold
        },
      },
      take: parseInt(limit as string),
    });

    // Step 2: Fetch full product details for top sellers
    const topSellingProducts = await Promise.all(
      topSellingData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
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
        });

        if (!product) return null;

        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.id,
          imageUrl: product.images.length > 0 ? product.images[0] : null,
        };
      })
    );

    // Filter out any null products (in case product was deleted)
    const validProducts = topSellingProducts.filter((p) => p !== null);

    res.json({
      topSellingProducts: validProducts,
      count: validProducts.length,
    });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({ error: 'Failed to fetch top selling products' });
  }
};