import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Upload offer image (Admin only)
export const uploadOfferImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as any;

    if (!file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }

    // Cloudinary storage stores the URL - prefer secure_url (HTTPS)
    const imageUrl = file.secure_url || file.path || file.url;

    console.log('Offer image file object:', file);
    console.log('Offer image uploaded to Cloudinary:', imageUrl);

    if (!imageUrl) {
      res.status(500).json({ error: 'Failed to get uploaded file URL' });
      return;
    }

    res.status(200).json({
      message: 'Image uploaded successfully',
      url: imageUrl,
    });
  } catch (error) {
    console.error('Upload offer image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Get all active offers for homepage
export const getActiveOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const offers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        displayOnHomepage: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(offers);
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// Get all offers (Admin)
export const getAllOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status } = req.query;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// Get offer by ID
export const getOfferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Offer ID is required' });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
    });

    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    res.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
};

// Create offer (Admin)
export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const offerData = req.body;

    // Convert date strings to Date objects
    const offer = await prisma.offer.create({
      data: {
        ...offerData,
        startDate: new Date(offerData.startDate),
        endDate: new Date(offerData.endDate),
      },
    });

    res.status(201).json(offer);
  } catch (error: any) {
    console.error('Error creating offer:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Offer code already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create offer' });
  }
};

// Update offer (Admin)
export const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offerData = req.body;

    if (!id) {
      res.status(400).json({ error: 'Offer ID is required' });
      return;
    }

    // Convert date strings to Date objects if they exist
    const updateData: any = { ...offerData };
    if (offerData.startDate) {
      updateData.startDate = new Date(offerData.startDate);
    }
    if (offerData.endDate) {
      updateData.endDate = new Date(offerData.endDate);
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    res.json(offer);
  } catch (error: any) {
    console.error('Error updating offer:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Offer code already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to update offer' });
  }
};

// Delete offer (Admin)
export const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Offer ID is required' });
      return;
    }

    await prisma.offer.delete({
      where: { id },
    });

    res.json({ message: 'Offer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete offer' });
  }
};

// Apply offer code
export const applyOfferCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal === undefined) {
      res.status(400).json({ error: 'Code and cart total are required' });
      return;
    }

    const now = new Date();

    const offer = await prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!offer) {
      res.status(404).json({ error: 'Invalid offer code' });
      return;
    }

    // Validate offer
    if (offer.status !== 'ACTIVE') {
      res.status(400).json({ error: 'This offer is no longer active' });
      return;
    }

    if (offer.startDate > now) {
      res.status(400).json({ error: 'This offer has not started yet' });
      return;
    }

    if (offer.endDate < now) {
      res.status(400).json({ error: 'This offer has expired' });
      return;
    }

    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) {
      res.status(400).json({ error: 'This offer has reached its usage limit' });
      return;
    }

    if (cartTotal < offer.minPurchase) {
      res.status(400).json({
        error: `Minimum purchase of ৳${offer.minPurchase} required for this offer`
      });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discount = (cartTotal * offer.discountValue) / 100;
      if (offer.maxDiscount && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
      }
    } else {
      discount = offer.discountValue;
    }

    res.json({
      valid: true,
      discount,
      finalAmount: Math.max(0, cartTotal - discount),
      offer: {
        id: offer.id,
        name: offer.name,
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
      },
    });
  } catch (error) {
    console.error('Error applying offer code:', error);
    res.status(500).json({ error: 'Failed to apply offer code' });
  }
};

// Increment usage count when offer is used
export const incrementOfferUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Offer ID is required' });
      return;
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    res.json(offer);
  } catch (error) {
    console.error('Error incrementing offer usage:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
};
