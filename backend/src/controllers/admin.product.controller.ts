import type{ Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// Helper function to resolve category ID from name or ID
async function resolveCategoryId(categoryIdentifier: string): Promise<string | null> {
  // First try to find by ID
  let category = await prisma.category.findUnique({
    where: { id: categoryIdentifier },
  });

  // If not found by ID, try to find by name
  if (!category) {
    category = await prisma.category.findFirst({
      where: { name: categoryIdentifier },
    });
  }

  // If still not found, try to find by slug
  if (!category) {
    category = await prisma.category.findUnique({
      where: { slug: categoryIdentifier },
    });
  }

  return category?.id || null;
}

// Helper function to resolve brand ID from name or ID
async function resolveBrandId(brandIdentifier: string): Promise<string | null> {
  // First try to find by ID
  let brand = await prisma.brand.findUnique({
    where: { id: brandIdentifier },
  });

  // If not found by ID, try to find by name
  if (!brand) {
    brand = await prisma.brand.findFirst({
      where: { name: brandIdentifier },
    });
  }

  // If still not found, try to find by slug
  if (!brand) {
    brand = await prisma.brand.findUnique({
      where: { slug: brandIdentifier },
    });
  }

  return brand?.id || null;
}

// Helper function to resolve type ID from name, slug, or ID
async function resolveTypeId(typeIdentifier: string): Promise<string | null> {
  // First try to find by ID
  let type = await prisma.type.findUnique({
    where: { id: typeIdentifier },
  });

  // If not found by ID, try to find by name
  if (!type) {
    type = await prisma.type.findFirst({
      where: { name: typeIdentifier },
    });
  }

  // If still not found, try to find by slug
  if (!type) {
    type = await prisma.type.findFirst({
      where: { slug: typeIdentifier },
    });
  }

  return type?.id || null;
}

// Helper function to resolve subcategory ID from name, slug, or ID
async function resolveSubCategoryId(subCategoryIdentifier: string): Promise<string | null> {
  // First try to find by ID
  let subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryIdentifier },
  });

  // If not found by ID, try to find by name
  if (!subCategory) {
    subCategory = await prisma.subCategory.findFirst({
      where: { name: subCategoryIdentifier },
    });
  }

  // If still not found, try to find by slug
  if (!subCategory) {
    subCategory = await prisma.subCategory.findFirst({
      where: { slug: subCategoryIdentifier },
    });
  }

  return subCategory?.id || null;
}

// Helper function to get hierarchy from subCategory
async function getHierarchyFromSubCategory(subCategoryId: string): Promise<{
  categoryId: string;
  typeId: string;
  subCategoryId: string;
} | null> {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    include: {
      Type: {
        include: {
          Category: true,
        },
      },
    },
  });

  if (!subCategory) {
    return null;
  }

  return {
    categoryId: subCategory.Type.Category.id,
    typeId: subCategory.Type.id,
    subCategoryId: subCategory.id,
  };
}

// Get all products with filtering (Admin view)
export const getAllProductsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      type,
      subCategory,
      brand,
      featured,
      inStock,
      sortBy = 'createdAt',
      order = 'desc',
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Resolve category ID from name or ID
    if (category) {
      const categoryId = await resolveCategoryId(category as string);
      if (categoryId) {
        where.categoryId = categoryId;
      }
    }

    // Resolve type ID from name or ID
    if (type) {
      const typeId = await resolveTypeId(type as string);
      if (typeId) {
        where.typeId = typeId;
      }
    }

    // Resolve subcategory ID from name or ID
    if (subCategory) {
      const subCategoryId = await resolveSubCategoryId(subCategory as string);
      if (subCategoryId) {
        where.subCategoryId = subCategoryId;
      }
    }

    // Resolve brand ID from name or ID
    if (brand) {
      const brandId = await resolveBrandId(brand as string);
      if (brandId) {
        where.brandId = brandId;
      }
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    } else if (inStock === 'false') {
      where.stock = 0;
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          Category: true,
          Type: true,
          SubCategory: true,
          Brand: true,
          Review: {
            select: { rating: true },
          },
          _count: {
            select: {
              Review: true,
              OrderItem: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: order as 'asc' | 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product (in memory, no additional queries)
    const productsWithRating = products.map((product) => {
      const reviews = product.Review;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      const { Review, ...productWithoutReviews } = product;

      return {
        ...productWithoutReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        totalOrders: product._count.OrderItem,
      };
    });

    res.json({
      products: productsWithRating,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Get all products admin error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID (Admin view with detailed stats)
export const getProductByIdAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        Category: true,
        Type: true,
        SubCategory: true,
        Brand: true,
        Review: {
          include: {
            User: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        OrderItem: {
          include: {
            Order: {
              select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Calculate statistics
    const averageRating =
      product.Review.length > 0
        ? product.Review.reduce((sum, r) => sum + r.rating, 0) /
          product.Review.length
        : 0;

    const totalRevenue = product.OrderItem.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const totalUnitsSold = product.OrderItem.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.json({
      ...product,
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: product.Review.length,
        totalOrders: product.OrderItem.length,
        totalUnitsSold,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get product by ID admin error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create new product - ACCEPTS SUBCATEGORY AND AUTO-POPULATES HIERARCHY
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Create product request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      images,
      featured,
      subCategoryId,      // NEW: Primary way to specify category hierarchy
      subCategoryName,    // NEW: Accept subcategory name
      subCategorySlug,    // NEW: Accept subcategory slug
      categoryId,         // Optional: Backward compatibility
      categoryName,
      categorySlug,
      typeId,             // Optional: Backward compatibility
      typeName,
      typeSlug,
      brandId,
      brandName,
      brandSlug,
      concernId,
    } = req.body;

    console.log('📸 Images received:', images);
    console.log('📸 Images type:', typeof images);
    console.log('📸 Is array?', Array.isArray(images));

    // Validate required fields
    if (!name || !slug || !price) {
      res.status(400).json({
        error: 'Missing required fields: name, slug, price',
      });
      return;
    }

    // Validate price
    if (price <= 0) {
      res.status(400).json({ error: 'Price must be greater than 0' });
      return;
    }

    // Validate sale price if provided
    if (salePrice && salePrice >= price) {
      res.status(400).json({
        error: 'Sale price must be less than regular price',
      });
      return;
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      res.status(400).json({ error: 'Product slug already exists' });
      return;
    }

    // HIERARCHY RESOLUTION (ALL OPTIONAL)
    // Priority: subCategory > explicit category/type > none (all optional)
    let finalCategoryId: string | null = null;
    let finalTypeId: string | null = null;
    let finalSubCategoryId: string | null = null;

    // Option 1: Resolve from subCategory (RECOMMENDED - auto-populates everything)
    if (subCategoryId || subCategoryName || subCategorySlug) {
      let resolvedSubCategoryId: string | null = null;

      if (subCategoryId) {
        resolvedSubCategoryId = subCategoryId;
      } else if (subCategoryName) {
        resolvedSubCategoryId = await resolveSubCategoryId(subCategoryName);
      } else if (subCategorySlug) {
        resolvedSubCategoryId = await resolveSubCategoryId(subCategorySlug);
      }

      if (!resolvedSubCategoryId) {
        res.status(404).json({ error: 'SubCategory not found' });
        return;
      }

      // Get full hierarchy from subcategory
      const hierarchy = await getHierarchyFromSubCategory(resolvedSubCategoryId);

      if (!hierarchy) {
        res.status(404).json({ error: 'SubCategory not found or invalid' });
        return;
      }

      finalCategoryId = hierarchy.categoryId;
      finalTypeId = hierarchy.typeId;
      finalSubCategoryId = hierarchy.subCategoryId;

      console.log('✅ Hierarchy resolved from SubCategory:', hierarchy);
    }
    // Option 2: Manual specification (optional - can provide category and/or type)
    else if (categoryId || categoryName || categorySlug || typeId || typeName || typeSlug) {
      // Resolve category (if provided)
      if (categoryId || categoryName || categorySlug) {
        let resolvedCategoryId: string | null = null;
        if (categoryId) {
          resolvedCategoryId = categoryId;
        } else if (categoryName) {
          resolvedCategoryId = await resolveCategoryId(categoryName);
        } else if (categorySlug) {
          resolvedCategoryId = await resolveCategoryId(categorySlug);
        }

        if (!resolvedCategoryId) {
          res.status(404).json({ error: 'Category not found' });
          return;
        }
        finalCategoryId = resolvedCategoryId;
      }

      // Resolve type (if provided)
      if (typeId || typeName || typeSlug) {
        let resolvedTypeId: string | null = null;
        if (typeId) {
          resolvedTypeId = typeId;
        } else if (typeName) {
          resolvedTypeId = await resolveTypeId(typeName);
        } else if (typeSlug) {
          resolvedTypeId = await resolveTypeId(typeSlug);
        }

        if (!resolvedTypeId) {
          res.status(404).json({ error: 'Type not found' });
          return;
        }
        finalTypeId = resolvedTypeId;
      }

      console.log('✅ Manual hierarchy specified - Category:', finalCategoryId, 'Type:', finalTypeId);
    }
    // Option 3: No hierarchy provided (now allowed)
    else {
      console.log('⚠️ No category hierarchy provided - product will be created without categories');
    }

    // Resolve brand ID (optional)
    let finalBrandId: string | null = null;

    if (brandId) {
      finalBrandId = brandId;
    } else if (brandName) {
      finalBrandId = await resolveBrandId(brandName);
    } else if (brandSlug) {
      finalBrandId = await resolveBrandId(brandSlug);
    }

    // Verify brand exists (if provided)
    if (finalBrandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: finalBrandId },
      });

      if (!brand) {
        res.status(404).json({
          error: 'Brand not found. Please check the brand identifier.'
        });
        return;
      }
    }

    // Create product
    const productData = {
      name,
      slug,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      stock: stock ? parseInt(stock) : 0,
      images: images || [],
      featured: featured === true || featured === 'true',
      categoryId: finalCategoryId,
      typeId: finalTypeId,
      subCategoryId: finalSubCategoryId,
      brandId: finalBrandId,
      concernId: concernId || null,
    };

    console.log('💾 Creating product with data:', JSON.stringify(productData, null, 2));

    const product = await prisma.product.create({
      data: productData,
      include: {
        Category: true,
        Type: true,
        SubCategory: true,
        Brand: true,
      },
    });

    console.log('✅ Product created successfully');
    console.log('🖼️ Product images in DB:', product.images);

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product - ACCEPTS SUBCATEGORY AND AUTO-POPULATES HIERARCHY
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      stock,
      images,
      featured,
      subCategoryId,      // NEW: Primary way to update category hierarchy
      subCategoryName,
      subCategorySlug,
      categoryId,         // Optional: Backward compatibility
      categoryName,
      categorySlug,
      typeId,
      typeName,
      typeSlug,
      brandId,
      brandName,
      brandSlug,
      concernId,
    } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // If slug is being updated, check if it's already taken
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      });

      if (slugExists) {
        res.status(400).json({ error: 'Product slug already exists' });
        return;
      }
    }

    // Validate sale price if being updated
    if (price && salePrice && salePrice >= price) {
      res.status(400).json({
        error: 'Sale price must be less than regular price',
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (images !== undefined) updateData.images = images;
    if (featured !== undefined) updateData.featured = featured;

    // HIERARCHY RESOLUTION - Auto-populate from subCategory if provided
    if (subCategoryId || subCategoryName || subCategorySlug) {
      let resolvedSubCategoryId: string | null = null;

      if (subCategoryId) {
        resolvedSubCategoryId = subCategoryId;
      } else if (subCategoryName) {
        resolvedSubCategoryId = await resolveSubCategoryId(subCategoryName);
      } else if (subCategorySlug) {
        resolvedSubCategoryId = await resolveSubCategoryId(subCategorySlug);
      }

      if (!resolvedSubCategoryId) {
        res.status(404).json({ error: 'SubCategory not found' });
        return;
      }

      // Get full hierarchy from subcategory
      const hierarchy = await getHierarchyFromSubCategory(resolvedSubCategoryId);

      if (!hierarchy) {
        res.status(404).json({ error: 'SubCategory not found or invalid' });
        return;
      }

      updateData.categoryId = hierarchy.categoryId;
      updateData.typeId = hierarchy.typeId;
      updateData.subCategoryId = hierarchy.subCategoryId;

      console.log('✅ Hierarchy resolved from SubCategory:', hierarchy);
    }
    // Manual category/type update (requires all three to be provided)
    else if (categoryId || categoryName || categorySlug || typeId || typeName || typeSlug) {
      res.status(400).json({
        error: 'Please provide subCategory identifier to update category hierarchy. SubCategory will auto-populate Category and Type.',
      });
      return;
    }

    // Resolve brand ID if provided
    if (brandId !== undefined || brandName !== undefined || brandSlug !== undefined) {
      let finalBrandId: string | null = null;

      if (brandId) {
        finalBrandId = brandId;
      } else if (brandName) {
        finalBrandId = await resolveBrandId(brandName);
      } else if (brandSlug) {
        finalBrandId = await resolveBrandId(brandSlug);
      }

      if (brandId && !finalBrandId) {
        res.status(404).json({
          error: 'Brand not found. Please check the brand identifier.'
        });
        return;
      }

      updateData.brandId = finalBrandId;
    }

    // Handle concernId if provided
    if (concernId !== undefined) {
      updateData.concernId = concernId || null;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        Category: true,
        Type: true,
        SubCategory: true,
        Brand: true,
      },
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
        throw new Error('Product ID is required');
    }


    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        OrderItem: true,
        Review: true,
        CartItem: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if product has orders
    if (product.OrderItem.length > 0) {
      res.status(400).json({
        error:
          'Cannot delete product with existing orders. Consider marking it as out of stock instead.',
      });
      return;
    }

    // Delete related data first
    await prisma.$transaction([
      // Delete cart items
      prisma.cartItem.deleteMany({
        where: { productId: id },
      }),
      // Delete reviews
      prisma.review.deleteMany({
        where: { productId: id },
      }),
      // Delete product
      prisma.product.delete({
        where: { id },
      }),
    ]);

    res.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Bulk update products - ENHANCED to accept names
export const bulkUpdateProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, updates } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: 'Product IDs array is required' });
      return;
    }

    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'Updates object is required' });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (updates.featured !== undefined) updateData.featured = updates.featured;
    if (updates.stock !== undefined) updateData.stock = parseInt(updates.stock);
    
    // Resolve category ID from name or ID
    if (updates.categoryId || updates.categoryName || updates.categorySlug) {
      let finalCategoryId: string | null = null;

      if (updates.categoryId) {
        finalCategoryId = updates.categoryId;
      } else if (updates.categoryName) {
        finalCategoryId = await resolveCategoryId(updates.categoryName);
      } else if (updates.categorySlug) {
        finalCategoryId = await resolveCategoryId(updates.categorySlug);
      }

      if (!finalCategoryId) {
        res.status(404).json({ 
          error: 'Category not found. Please check the category identifier.' 
        });
        return;
      }

      updateData.categoryId = finalCategoryId;
    }

    // Resolve brand ID from name or ID
    if (updates.brandId !== undefined || updates.brandName !== undefined || updates.brandSlug !== undefined) {
      let finalBrandId: string | null = null;

      if (updates.brandId) {
        finalBrandId = updates.brandId;
      } else if (updates.brandName) {
        finalBrandId = await resolveBrandId(updates.brandName);
      } else if (updates.brandSlug) {
        finalBrandId = await resolveBrandId(updates.brandSlug);
      }

      updateData.brandId = finalBrandId;
    }

    // Update products
    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: updateData,
    });

    res.json({
      message: 'Products updated successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk update products error:', error);
    res.status(500).json({ error: 'Failed to update products' });
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!categoryId) {
        res.status(400).json({ error: 'Category ID is required' });
        return;
    }

    // Resolve category ID from name, slug, or ID
    const finalCategoryId = await resolveCategoryId(categoryId);

    if (!finalCategoryId) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: finalCategoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: finalCategoryId },
        include: {
          Category: true,
          Brand: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { categoryId: finalCategoryId } }),
    ]);

    res.json({
      category,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get products by brand
export const getProductsByBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brandId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    if (!brandId) {
        res.status(400).json({ error: 'Brand ID is required' });
        return;
    }

    // Resolve brand ID from name, slug, or ID
    const finalBrandId = await resolveBrandId(brandId);

    if (!finalBrandId) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: finalBrandId },
    });

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { brandId: finalBrandId },
        include: {
          Category: true,
          Brand: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { brandId: finalBrandId } }),
    ]);

    res.json({
      brand,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error('Get products by brand error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get products by type
export const getProductsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { typeId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!typeId) {
      res.status(400).json({ error: 'Type ID is required' });
      return;
    }

    // Resolve type ID from name, slug, or ID
    const finalTypeId = await resolveTypeId(typeId);

    if (!finalTypeId) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    // Verify type exists
    const type = await prisma.type.findUnique({
      where: { id: finalTypeId },
      include: {
        Category: true,
      },
    });

    if (!type) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { typeId: finalTypeId },
        include: {
          Category: true,
          Type: true,
          SubCategory: true,
          Brand: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { typeId: finalTypeId } }),
    ]);

    res.json({
      type,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error('Get products by type error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get products by subcategory
export const getProductsBySubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subCategoryId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!subCategoryId) {
      res.status(400).json({ error: 'SubCategory ID is required' });
      return;
    }

    // Resolve subcategory ID from name, slug, or ID
    const finalSubCategoryId = await resolveSubCategoryId(subCategoryId);

    if (!finalSubCategoryId) {
      res.status(404).json({ error: 'SubCategory not found' });
      return;
    }

    // Verify subcategory exists
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: finalSubCategoryId },
      include: {
        Type: {
          include: {
            Category: true,
          },
        },
      },
    });

    if (!subCategory) {
      res.status(404).json({ error: 'SubCategory not found' });
      return;
    }

    // Get products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { subCategoryId: finalSubCategoryId },
        include: {
          Category: true,
          Type: true,
          SubCategory: true,
          Brand: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { subCategoryId: finalSubCategoryId } }),
    ]);

    res.json({
      subCategory,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error('Get products by subcategory error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalProducts,
      outOfStock,
      lowStock,
      totalValue,
      byCategory,
      byBrand,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.count({ where: { stock: { lt: 10, gt: 0 } } }),
      prisma.product.aggregate({ _sum: { price: true } }),
      prisma.product.groupBy({ by: ['categoryId'], _count: true }),
      prisma.product.groupBy({ by: ['brandId'], _count: true }),
    ]);

    // Get category details
    const categoryStats = await Promise.all(
      byCategory
        .filter((item) => item.categoryId !== null)
        .map(async (item) => {
          const category = await prisma.category.findUnique({
            where: { id: item.categoryId! },
          });
          return {
            category,
            count: item._count,
          };
        })
    );

    // Get brand details
    const brandStats = await Promise.all(
      byBrand
        .filter((item) => item.brandId !== null)
        .map(async (item) => {
          const brand = await prisma.brand.findUnique({
            where: { id: item.brandId! },
          });
          return {
            brand,
            count: item._count,
          };
        })
    );

    res.json({
      overview: {
        totalProducts,
        inStock: totalProducts - outOfStock,
        outOfStock,
        lowStock,
        totalValue: totalValue._sum.price || 0,
      },
      byCategory: categoryStats,
      byBrand: brandStats,
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory statistics' });
  }
};

// Upload product images
export const uploadProductImages = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('✅ Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      console.log('❌ No files found in request');
      res.status(400).json({ error: 'No images uploaded' });
      return;
    }

    console.log('📦 Processing files:', files.length);
    const imageUrls = files.map((file: any) => {
      console.log('🔍 Full file object:', JSON.stringify(file, null, 2));
      console.log('🖼️ File path:', file.path);
      console.log('🖼️ File url:', file.url);
      console.log('🖼️ File secure_url:', file.secure_url);
      // Cloudinary storage provides both path and url
      return file.path || file.url || file.secure_url;
    });

    console.log('✅ Upload successful, URLs:', imageUrls);
    res.status(200).json({
      message: 'Images uploaded successfully',
      urls: imageUrls,
    });
  } catch (error) {
    console.error('❌ Upload product images error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Failed to upload images' });
  }
};