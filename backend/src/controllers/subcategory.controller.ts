import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getAllSubCategories = async (req: Request, res: Response) => {
  try {
    const { typeId, categoryId } = req.query;

    let where: any = {};

    if (typeId) {
      where.typeId = typeId as string;
    }

    if (categoryId) {
      where.Type = {
        categoryId: categoryId as string,
      };
    }

    const subCategories = await prisma.subCategory.findMany({
      where,
      include: {
        Type: {
          include: {
            Category: true,
          },
        },
        _count: {
          select: {
            Product: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

export const getSubCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        Type: {
          include: {
            Category: true,
          },
        },
        _count: {
          select: {
            Product: true,
          },
        },
      },
    });

    if (!subCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
    }

    res.json(subCategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
};

export const createSubCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, typeId } = req.body;

    if (!name || !slug || !typeId) {
      return res.status(400).json({ error: 'Name, slug, and typeId are required' });
    }

    // Check if type exists
    const type = await prisma.type.findUnique({
      where: { id: typeId },
    });

    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }

    // Check if subcategory with same slug already exists in this type
    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        slug,
        typeId,
      },
    });

    if (existingSubCategory) {
      return res.status(400).json({ error: 'SubCategory with this slug already exists in this type' });
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name,
        slug,
        description,
        typeId,
      },
      include: {
        Type: {
          include: {
            Category: true,
          },
        },
      },
    });

    res.status(201).json(subCategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
};

export const updateSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, typeId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
    });

    if (!existingSubCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
    }

    // If typeId is being changed, check if new type exists
    if (typeId && typeId !== existingSubCategory.typeId) {
      const type = await prisma.type.findUnique({
        where: { id: typeId },
      });

      if (!type) {
        return res.status(404).json({ error: 'Type not found' });
      }
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existingSubCategory.slug) {
      const conflictingSubCategory = await prisma.subCategory.findFirst({
        where: {
          slug,
          typeId: typeId || existingSubCategory.typeId,
          NOT: { id },
        },
      });

      if (conflictingSubCategory) {
        return res.status(400).json({ error: 'SubCategory with this slug already exists in this type' });
      }
    }

    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(typeId && { typeId }),
      },
      include: {
        Type: {
          include: {
            Category: true,
          },
        },
      },
    });

    res.json(subCategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
};

export const deleteSubCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Product: true,
          },
        },
      },
    });

    if (!existingSubCategory) {
      return res.status(404).json({ error: 'SubCategory not found' });
    }

    if (existingSubCategory._count.Product > 0) {
      return res.status(400).json({
        error: `Cannot delete subcategory with ${existingSubCategory._count.Product} products. Please delete or reassign the products first.`,
      });
    }

    await prisma.subCategory.delete({
      where: { id },
    });

    res.json({ message: 'SubCategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
};
