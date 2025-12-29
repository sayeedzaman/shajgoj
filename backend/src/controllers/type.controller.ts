import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';


export const getAllTypes = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;

    const where = categoryId ? { categoryId: categoryId as string } : {};

    const types = await prisma.type.findMany({
      where,
      include: {
        Category: true,
        SubCategory: true,
        _count: {
          select: {
            SubCategory: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(types);
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
};

export const getTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const type = await prisma.type.findUnique({
      where: { id },
      include: {
        Category: true,
        SubCategory: true,
        _count: {
          select: {
            SubCategory: true,
          },
        },
      },
    });

    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }

    res.json(type);
  } catch (error) {
    console.error('Error fetching type:', error);
    res.status(500).json({ error: 'Failed to fetch type' });
  }
};

export const createType = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId } = req.body;

    if (!name || !slug || !categoryId) {
      return res.status(400).json({ error: 'Name, slug, and categoryId are required' });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if type with same slug already exists in this category
    const existingType = await prisma.type.findFirst({
      where: {
        slug,
        categoryId,
      },
    });

    if (existingType) {
      return res.status(400).json({ error: 'Type with this slug already exists in this category' });
    }

    const type = await prisma.type.create({
      data: {
        name,
        slug,
        description,
        categoryId,
      },
      include: {
        Category: true,
      },
    });

    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating type:', error);
    res.status(500).json({ error: 'Failed to create type' });
  }
};

export const updateType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, categoryId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const existingType = await prisma.type.findUnique({
      where: { id },
    });

    if (!existingType) {
      return res.status(404).json({ error: 'Type not found' });
    }

    // If categoryId is being changed, check if new category exists
    if (categoryId && categoryId !== existingType.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // If slug is being changed, check for conflicts
    if (slug && slug !== existingType.slug) {
      const conflictingType = await prisma.type.findFirst({
        where: {
          slug,
          categoryId: categoryId || existingType.categoryId,
          NOT: { id },
        },
      });

      if (conflictingType) {
        return res.status(400).json({ error: 'Type with this slug already exists in this category' });
      }
    }

    const type = await prisma.type.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    res.json(type);
  } catch (error) {
    console.error('Error updating type:', error);
    res.status(500).json({ error: 'Failed to update type' });
  }
};

export const deleteType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const existingType = await prisma.type.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            SubCategory: true,
          },
        },
      },
    });

    if (!existingType) {
      return res.status(404).json({ error: 'Type not found' });
    }

    if (existingType._count.SubCategory > 0) {
      return res.status(400).json({
        error: `Cannot delete type with ${existingType._count.SubCategory} subcategories. Please delete or reassign the subcategories first.`,
      });
    }

    await prisma.type.delete({
      where: { id },
    });

    res.json({ message: 'Type deleted successfully' });
  } catch (error) {
    console.error('Error deleting type:', error);
    res.status(500).json({ error: 'Failed to delete type' });
  }
};
