import type { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters',
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Get all addresses for user
export const getAddresses = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

// Get address by ID
export const getAddressById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Address ID is required' });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
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
      return res.status(400).json({
        error: 'All address fields are required',
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: userId,
        fullName,
        phone,
        address,
        city,
        state,
        zipCode,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
};

// Update address
export const updateAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { fullName, phone, address, city, state, zipCode, isDefault } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Address ID is required' });
    }

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId,
      },
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
          NOT: { id: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updateData: Prisma.AddressUpdateInput = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: updateData,
    });

    res.json(updatedAddress);
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
};

// Delete address
export const deleteAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Address ID is required' });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.address.delete({
      where: { id: id },
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};

// Set default address
export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Address ID is required' });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset all default addresses
    await prisma.address.updateMany({
      where: {
        userId: userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set new default
    const updatedAddress = await prisma.address.update({
      where: { id: id },
      data: { isDefault: true },
    });

    res.json(updatedAddress);
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { page = '1', limit = '20', role, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};
    
    if (role && typeof role === 'string') {
      where.role = role as any;
    }
    
    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalUsers: total,
        hasMore: skip + users.length < total,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be USER or ADMIN',
      });
    }

    const user = await prisma.user.update({
      where: { id: id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user role error:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user role' });
  }
};