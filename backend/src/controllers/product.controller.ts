import type{ Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Get all products with optional filtering
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      typeId,
      subCategoryId,
      brandId,
      minPrice,
      maxPrice,
      featured,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '12', //ca
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Build where clause for filtering
    const where: any = {};

    if (subCategoryId) {
      where.subCategoryId = subCategoryId as string;
    } else if (typeId) {
      where.SubCategory = {
        typeId: typeId as string,
      };
    } else if (categoryId) {
      where.SubCategory = {
        Type: {
          categoryId: categoryId as string,
        },
      };
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
          SubCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              Type: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  Category: {
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
        SubCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            Type: {
              select: {
                id: true,
                name: true,
                slug: true,
                Category: {
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
          SubCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              Type: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  Category: {
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
      subCategoryId,
      brandId,
    } = req.body;

    // Validate required fields
    if (!name || !slug || !price || !subCategoryId) {
      return res.status(400).json({
        error: 'Missing required fields: name, slug, price, subCategoryId',
      });
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Product slug already exists' });
    }

    // Check if subcategory exists
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
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
        subCategoryId,
        brandId: brandId || null,
      },
      include: {
        SubCategory: {
          include: {
            Type: {
              include: {
                Category: true,
              },
            },
          },
        },
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
      subCategoryId,
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
    if (subCategoryId) updateData.subCategoryId = subCategoryId;
    if (brandId !== undefined) updateData.brandId = brandId || null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        SubCategory: {
          include: {
            Type: {
              include: {
                Category: true,
              },
            },
          },
        },
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

    const includeHierarchy = {
      SubCategory: {
        select: {
          id: true,
          name: true,
          slug: true,
          Type: {
            select: {
              id: true,
              name: true,
              slug: true,
              Category: {
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
      Brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    };

    // Step 1: Try to get products uploaded TODAY
    let products = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: todayStart, // Greater than or equal to today's start
        },
      },
      include: includeHierarchy,
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
        include: includeHierarchy,
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
        include: includeHierarchy,
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
    const {
      limit = '12',
      page = '1',
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy,
      order,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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
    });

    // Get all top-selling product IDs
    const topSellingProductIds = topSellingData.map((item) => item.productId);

    // Step 2: Build filter for products
    const where: any = {
      id: {
        in: topSellingProductIds,
      },
    };

    // Apply filters
    if (category) {
      where.SubCategory = {
        Type: {
          categoryId: category as string,
        },
      };
    }

    if (brand) {
      where.brandId = brand as string;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Step 3: Fetch filtered products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          SubCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
              Type: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  Category: {
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
          Brand: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    // Step 4: Attach sales data and sort
    let productsWithSalesData = products.map((product) => {
      const salesData = topSellingData.find((item) => item.productId === product.id);
      return {
        ...product,
        totalSold: salesData?._sum.quantity || 0,
        orderCount: salesData?._count.id || 0,
        imageUrl: product.images.length > 0 ? product.images[0] : null,
      };
    });

    // Apply custom sorting if provided
    if (sortBy === 'price') {
      productsWithSalesData.sort((a, b) => {
        const priceA = a.salePrice || a.price;
        const priceB = b.salePrice || b.price;
        return order === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else {
      // Default: sort by total sold (descending)
      productsWithSalesData.sort((a, b) => b.totalSold - a.totalSold);
    }

    res.json({
      products: productsWithSalesData,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalProducts: totalCount,
        hasMore: skip + limitNum < totalCount,
      },
    });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({ error: 'Failed to fetch top selling products' });
  }
};