import type{ Request, Response } from 'express';
import cloudinary from '../config/cloudinary.js';
import { prisma } from '../lib/prisma.js';

// ============= CATEGORY CONTROLLERS =============

// Get all categories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Type: {
          include: {
            SubCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { Product: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { Product: true, Type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get single category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        Type: {
          include: {
            SubCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
              orderBy: { name: 'asc' },
            },
            _count: {
              select: { Product: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { Product: true, Type: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// Upload category images (Admin only)
export const uploadCategoryImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as { [fieldname: string]: any[] };

    if (!files || Object.keys(files).length === 0) {
      res.status(400).json({ error: 'No images uploaded' });
      return;
    }

    const imageUrls: { [key: string]: string } = {};

    if (files.image && files.image[0]) {
      imageUrls.image = files.image[0].secure_url || files.image[0].path || files.image[0].url;
    }
    if (files.image2 && files.image2[0]) {
      imageUrls.image2 = files.image2[0].secure_url || files.image2[0].path || files.image2[0].url;
    }
    if (files.image3 && files.image3[0]) {
      imageUrls.image3 = files.image3[0].secure_url || files.image3[0].path || files.image3[0].url;
    }

    res.status(200).json({
      message: 'Images uploaded successfully',
      ...imageUrls,
    });
  } catch (error) {
    console.error('Upload category images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

// Create category (Admin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, image, image2, image3, types } = req.body;

    if (!name || !slug) {
      res.status(400).json({
        error: 'Name and slug are required',
      });
      return;
    }

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      res.status(400).json({ error: 'Category slug already exists' });
      return;
    }

    // Create category with types and subcategories in a transaction
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        image2: image2 || null,
        image3: image3 || null,
        Type: types && Array.isArray(types) && types.length > 0 ? {
          create: types.map((type: any) => ({
            name: type.name,
            slug: type.slug,
            description: type.description || null,
            image: type.image || null,
            SubCategory: type.subCategories && Array.isArray(type.subCategories) && type.subCategories.length > 0 ? {
              create: type.subCategories.map((subCat: any) => ({
                name: subCat.name,
                slug: subCat.slug,
                description: subCat.description || null,
                image: subCat.image || null,
              }))
            } : undefined,
          }))
        } : undefined,
      } as any,
      include: {
        Type: {
          include: {
            SubCategory: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update category (Admin only)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, image2, image3 } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if new slug conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug },
      });

      if (slugExists) {
        res.status(400).json({ error: 'Category slug already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (image2 !== undefined) updateData.image2 = image2;
    if (image3 !== undefined) updateData.image3 = image3;

    // If types are provided, handle them separately
    // Note: For updates, types and subcategories should be managed individually
    // through their own endpoints for better control and to avoid data loss

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        Type: {
          include: {
            SubCategory: true,
          },
        },
      },
    });

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete category (Admin only)
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Product ID is required');
    }


    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        Product: true,
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (category.Product.length > 0) {
      res.status(400).json({
        error: 'Cannot delete category with existing products',
      });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// ============= BRAND CONTROLLERS =============

// Get all brands
export const getAllBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ brands });
  } catch (error) {
    console.error('Get all brands error:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
};

// Get single brand by ID
export const getBrandById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Brand ID is required' });
      return;
    }

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Product: true },
        },
      },
    });

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json({ brand });
  } catch (error) {
    console.error('Get brand by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};

// Get single brand by slug
export const getBrandBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ error: 'Brand slug is required' });
      return;
    }

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { Product: true },
        },
      },
    });

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json({ brand });
  } catch (error) {
    console.error('Get brand by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
};

// Upload brand logo (Admin only)
export const uploadBrandLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as any;

    if (!file) {
      res.status(400).json({ error: 'No logo uploaded' });
      return;
    }

    // Cloudinary storage stores the URL - prefer secure_url (HTTPS)
    const logoUrl = file.secure_url || file.path || file.url;

    console.log('Brand logo file object:', file);
    console.log('Brand logo uploaded to Cloudinary:', logoUrl);

    if (!logoUrl) {
      res.status(500).json({ error: 'Failed to get uploaded file URL' });
      return;
    }

    res.status(200).json({
      message: 'Logo uploaded successfully',
      url: logoUrl,
    });
  } catch (error) {
    console.error('Upload brand logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};

// Create brand (Admin only)
export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, logo } = req.body;

    console.log('Creating brand with data:', { name, slug, logo });

    if (!name || !slug) {
      res.status(400).json({
        error: 'Name and slug are required',
      });
      return;
    }

    // Check if slug already exists
    const existing = await prisma.brand.findUnique({
      where: { slug },
    });

    if (existing) {
      res.status(400).json({ error: 'Brand slug already exists' });
      return;
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logo: logo || null,
      },
    });

    console.log('Brand created successfully:', brand);

    res.status(201).json({
      message: 'Brand created successfully',
      brand,
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
};

// Update brand (Admin only)
export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, logo } = req.body;

    console.log('Updating brand with data:', { id, name, slug, logo });

    if (!id) {
      res.status(400).json({ error: 'Brand ID is required' });
      return;
    }

    const existing = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // Check if new slug conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.brand.findUnique({
        where: { slug },
      });

      if (slugExists) {
        res.status(400).json({ error: 'Brand slug already exists' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logo !== undefined) updateData.logo = logo || null;

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    console.log('Brand updated successfully:', brand);

    res.json({
      message: 'Brand updated successfully',
      brand,
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
};

// Delete brand (Admin only)
export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error('Product ID is required');
    }

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        Product: true,
      },
    });

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    if (brand.Product.length > 0) {
      res.status(400).json({
        error: 'Cannot delete brand with existing products',
      });
      return;
    }

    await prisma.brand.delete({
      where: { id },
    });

    res.json({
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
};