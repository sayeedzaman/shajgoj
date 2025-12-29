import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

// ============= TYPE CONTROLLERS =============

// Get all types
export const getAllTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.query;

    const where = categoryId ? { categoryId: categoryId as string } : {};

    const types = await prisma.type.findMany({
      where,
      include: {
        Category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { SubCategory: true, Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ types });
  } catch (error) {
    console.error('Get all types error:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

// Get single type by ID
export const getTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Type ID is required' });
      return;
    }

    const type = await prisma.type.findUnique({
      where: { id },
      include: {
        Category: {
          select: { id: true, name: true, slug: true },
        },
        SubCategory: {
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { SubCategory: true, Product: true },
        },
      },
    });

    if (!type) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    res.json({ type });
  } catch (error) {
    console.error('Get type by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch type' });
  }
};

// Get types by category ID
export const getTypesByCategoryId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      res.status(400).json({ error: 'Category ID is required' });
      return;
    }

    const types = await prisma.type.findMany({
      where: { categoryId },
      include: {
        _count: {
          select: { SubCategory: true, Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ types });
  } catch (error) {
    console.error('Get types by category ID error:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

// Create type (Admin only)
export const createType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, image, categoryId, categorySlug, categoryName } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Name and slug are required' });
      return;
    }

    // Resolve category ID
    let resolvedCategoryId = categoryId;

    if (!resolvedCategoryId) {
      if (categorySlug) {
        const category = await prisma.category.findUnique({
          where: { slug: categorySlug },
        });
        if (!category) {
          res.status(404).json({ error: 'Category not found with provided slug' });
          return;
        }
        resolvedCategoryId = category.id;
      } else if (categoryName) {
        const category = await prisma.category.findUnique({
          where: { name: categoryName },
        });
        if (!category) {
          res.status(404).json({ error: 'Category not found with provided name' });
          return;
        }
        resolvedCategoryId = category.id;
      } else {
        res.status(400).json({ error: 'Category ID, slug, or name is required' });
        return;
      }
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: resolvedCategoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check if slug already exists within this category
    const existing = await prisma.type.findFirst({
      where: {
        categoryId: resolvedCategoryId,
        slug,
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Type slug already exists in this category' });
      return;
    }

    const type = await prisma.type.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        categoryId: resolvedCategoryId,
      } as any,
      include: {
        Category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(201).json({
      message: 'Type created successfully',
      type,
    });
  } catch (error) {
    console.error('Create type error:', error);
    res.status(500).json({ error: 'Failed to create type' });
  }
};

// Update type (Admin only)
export const updateType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, categoryId } = req.body;

    if (!id) {
      res.status(400).json({ error: 'Type ID is required' });
      return;
    }

    const existing = await prisma.type.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    // Check if new slug conflicts within the same category
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.type.findFirst({
        where: {
          categoryId: categoryId || existing.categoryId,
          slug,
          NOT: { id },
        },
      });

      if (slugExists) {
        res.status(400).json({ error: 'Type slug already exists in this category' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const type = await prisma.type.update({
      where: { id },
      data: updateData,
      include: {
        Category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      message: 'Type updated successfully',
      type,
    });
  } catch (error) {
    console.error('Update type error:', error);
    res.status(500).json({ error: 'Failed to update type' });
  }
};

// Delete type (Admin only)
export const deleteType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Type ID is required');
    }

    const type = await prisma.type.findUnique({
      where: { id },
      include: {
        Product: true,
        SubCategory: true,
      },
    });

    if (!type) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    if (type.Product.length > 0) {
      res.status(400).json({
        error: 'Cannot delete type with existing products',
      });
      return;
    }

    if (type.SubCategory.length > 0) {
      res.status(400).json({
        error: 'Cannot delete type with existing subcategories',
      });
      return;
    }

    await prisma.type.delete({
      where: { id },
    });

    res.json({
      message: 'Type deleted successfully',
    });
  } catch (error) {
    console.error('Delete type error:', error);
    res.status(500).json({ error: 'Failed to delete type' });
  }
};

// ============= SUBCATEGORY CONTROLLERS =============

// Get all subcategories
export const getAllSubCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { typeId } = req.query;

    const where = typeId ? { typeId: typeId as string } : {};

    const subCategories = await prisma.subCategory.findMany({
      where,
      include: {
        Type: {
          select: {
            id: true,
            name: true,
            slug: true,
            Category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ subCategories });
  } catch (error) {
    console.error('Get all subcategories error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

// Get single subcategory by ID
export const getSubCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'SubCategory ID is required' });
      return;
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        Type: {
          select: {
            id: true,
            name: true,
            slug: true,
            Category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { Product: true },
        },
      },
    });

    if (!subCategory) {
      res.status(404).json({ error: 'SubCategory not found' });
      return;
    }

    res.json({ subCategory });
  } catch (error) {
    console.error('Get subcategory by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
};

// Get subcategories by type ID
export const getSubCategoriesByTypeId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { typeId } = req.params;
    if (!typeId) {
      res.status(400).json({ error: 'Type ID is required' });
      return;
    }

    const subCategories = await prisma.subCategory.findMany({
      where: { typeId },
      include: {
        _count: {
          select: { Product: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ subCategories });
  } catch (error) {
    console.error('Get subcategories by type ID error:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

// Create subcategory (Admin only)
export const createSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, image, typeId, typeSlug, typeName } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Name and slug are required' });
      return;
    }

    // Resolve type ID
    let resolvedTypeId = typeId;

    if (!resolvedTypeId) {
      if (typeSlug) {
        const type = await prisma.type.findFirst({
          where: { slug: typeSlug },
        });
        if (!type) {
          res.status(404).json({ error: 'Type not found with provided slug' });
          return;
        }
        resolvedTypeId = type.id;
      } else if (typeName) {
        const type = await prisma.type.findFirst({
          where: { name: typeName },
        });
        if (!type) {
          res.status(404).json({ error: 'Type not found with provided name' });
          return;
        }
        resolvedTypeId = type.id;
      } else {
        res.status(400).json({ error: 'Type ID, slug, or name is required' });
        return;
      }
    }

    // Verify type exists
    const type = await prisma.type.findUnique({
      where: { id: resolvedTypeId },
      include: {
        Category: true,
      },
    });

    if (!type) {
      res.status(404).json({ error: 'Type not found' });
      return;
    }

    // Check if slug already exists within this type
    const existing = await prisma.subCategory.findFirst({
      where: {
        typeId: resolvedTypeId,
        slug,
      },
    });

    if (existing) {
      res.status(400).json({ error: 'SubCategory slug already exists in this type' });
      return;
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        typeId: resolvedTypeId,
      } as any,
      include: {
        Type: {
          select: {
            id: true,
            name: true,
            slug: true,
            Category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'SubCategory created successfully',
      subCategory,
    });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
};

// Update subcategory (Admin only)
export const updateSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, typeId } = req.body;

    if (!id) {
      res.status(400).json({ error: 'SubCategory ID is required' });
      return;
    }

    const existing = await prisma.subCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: 'SubCategory not found' });
      return;
    }

    // Check if new slug conflicts within the same type
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.subCategory.findFirst({
        where: {
          typeId: typeId || existing.typeId,
          slug,
          NOT: { id },
        },
      });

      if (slugExists) {
        res.status(400).json({ error: 'SubCategory slug already exists in this type' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (typeId !== undefined) updateData.typeId = typeId;

    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: updateData,
      include: {
        Type: {
          select: {
            id: true,
            name: true,
            slug: true,
            Category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    res.json({
      message: 'SubCategory updated successfully',
      subCategory,
    });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
};

// Delete subcategory (Admin only)
export const deleteSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('SubCategory ID is required');
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        Product: true,
      },
    });

    if (!subCategory) {
      res.status(404).json({ error: 'SubCategory not found' });
      return;
    }

    if (subCategory.Product.length > 0) {
      res.status(400).json({
        error: 'Cannot delete subcategory with existing products',
      });
      return;
    }

    await prisma.subCategory.delete({
      where: { id },
    });

    res.json({
      message: 'SubCategory deleted successfully',
    });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
};
