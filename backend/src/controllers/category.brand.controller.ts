import type{ Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============= CATEGORY CONTROLLERS =============

// Get all categories
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
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
        _count: {
          select: { products: true },
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

// Create category (Admin only)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, image, image2, image3 } = req.body;

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

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        image2,
        image3,
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

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
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
        products: true,
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (category.products.length > 0) {
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
          select: { products: true },
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
          select: { products: true },
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

// Create brand (Admin only)
export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, logo } = req.body;

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
        logo,
      },
    });

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
    if (logo !== undefined) updateData.logo = logo;

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

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
        products: true,
      },
    });

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    if (brand.products.length > 0) {
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