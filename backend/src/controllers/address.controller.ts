import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Get all addresses for authenticated user
export const getUserAddresses = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: {
        isDefault: 'desc'
      }
    });

    return res.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

// Get single address by ID
export const getAddressById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(401).json({ error: 'User not authenticated or invalid address ID' });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    return res.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return res.status(500).json({ error: 'Failed to fetch address' });
  }
};

// Create new address
export const createAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { fullName, phone, address, city, state, zipCode, isDefault } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!fullName || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({ error: 'All address fields are required' });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
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
        userId
      }
    });

    return res.status(201).json(newAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    return res.status(500).json({ error: 'Failed to create address' });
  }
};

// Update address
export const updateAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { fullName, phone, address, city, state, zipCode, isDefault } = req.body;

    if (!userId || !id) {
      return res.status(401).json({ error: 'User not authenticated or invalid address ID' });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: userId,
          isDefault: true,
          NOT: { id: id }
        },
        data: { isDefault: false }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: {
        fullName: fullName || existingAddress.fullName,
        phone: phone || existingAddress.phone,
        address: address || existingAddress.address,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        zipCode: zipCode || existingAddress.zipCode,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      }
    });

    return res.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({ error: 'Failed to update address' });
  }
};

// Delete address
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(401).json({ error: 'User not authenticated or invalid address ID' });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id: id }
    });

    return res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ error: 'Failed to delete address' });
  }
};
