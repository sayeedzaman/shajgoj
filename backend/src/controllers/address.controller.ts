import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Get all addresses for authenticated user
export const getUserAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    res.json({ addresses });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

// Get address by ID
export const getAddressById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'Address ID is required' });
      return;
    }

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    res.json({ address });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
};

// Create new address
export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { fullName, phone, address, city, state, zipCode, isDefault } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Validate required fields
    if (!fullName || !phone || !address || !city || !state || !zipCode) {
      res.status(400).json({ error: 'All address fields are required' });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        fullName,
        phone,
        address,
        city,
        state,
        zipCode,
        isDefault: isDefault || false,
        userId,
      },
    });

    res.status(201).json({
      message: 'Address created successfully',
      address: newAddress,
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
};

// Update address
export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { fullName, phone, address, city, state, zipCode, isDefault } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'Address ID is required' });
      return;
    }

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingAddress) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress,
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
};

// Delete address
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!id) {
      res.status(400).json({ error: 'Address ID is required' });
      return;
    }

    // Check if address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    await prisma.address.delete({
      where: { id },
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};