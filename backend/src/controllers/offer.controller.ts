import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { applyOfferPricing } from '../lib/offerPricing.js';

const prisma = new PrismaClient();

// Storefront offer responses show each linked product at its running offer price
const withOfferProductPrices = async <T extends { OfferProduct: Array<{ Product: Parameters<typeof applyOfferPricing>[0][number] }> }>(offers: T[]) => {
  const priced = await applyOfferPricing(offers.flatMap((offer) => offer.OfferProduct.map((op) => op.Product)));
  let i = 0;
  return offers.map((offer) => ({
    ...offer,
    OfferProduct: offer.OfferProduct.map((op) => ({ ...op, Product: priced[i++]! })),
  }));
};

// Admin reporting: total discount each offer has given and how many orders used it (cancelled orders excluded)
const getOfferDiscountStats = async (offerIds: string[]) => {
  const stats = new Map<string, { discountGiven: number; orders: number }>();
  if (offerIds.length === 0) return stats;

  const items = await prisma.orderItem.findMany({
    where: { offerId: { in: offerIds }, Order: { status: { not: 'CANCELLED' } } },
    select: { offerId: true, orderId: true, price: true, originalPrice: true, quantity: true },
  });

  const ordersByOffer = new Map<string, Set<string>>();
  for (const item of items) {
    const offerId = item.offerId!;
    const entry = stats.get(offerId) ?? { discountGiven: 0, orders: 0 };
    entry.discountGiven += ((item.originalPrice ?? item.price) - item.price) * item.quantity;
    stats.set(offerId, entry);
    ordersByOffer.set(offerId, (ordersByOffer.get(offerId) ?? new Set()).add(item.orderId));
  }
  for (const [offerId, orders] of ordersByOffer) {
    stats.get(offerId)!.orders = orders.size;
    stats.get(offerId)!.discountGiven = parseFloat(stats.get(offerId)!.discountGiven.toFixed(2));
  }
  return stats;
};

type OfferStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED';

// Status is derived from the dates so offers go live / expire on their own
const deriveStatus = (startDate: Date, endDate: Date, now = new Date()): OfferStatus => {
  if (now < startDate) return 'SCHEDULED';
  if (now > endDate) return 'EXPIRED';
  return 'ACTIVE';
};

const withLiveStatus = <T extends { startDate: Date; endDate: Date }>(offer: T) => ({
  ...offer,
  status: deriveStatus(offer.startDate, offer.endDate),
});

const parseDate = (value: unknown): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date;
};

// Fields the client may send back from a fetched offer that must not be written
const stripReadOnlyFields = (data: any) => {
  const { id, createdAt, updatedAt, usageCount, OfferProduct, status, ...rest } = data;
  return rest;
};

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
        displayOnHomepage: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        OfferProduct: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json((await withOfferProductPrices(offers)).map(withLiveStatus));
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

    const now = new Date();
    if (status === 'ACTIVE') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === 'SCHEDULED') {
      where.startDate = { gt: now };
    } else if (status === 'EXPIRED') {
      where.endDate = { lt: now };
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        OfferProduct: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const stats = await getOfferDiscountStats(offers.map((offer) => offer.id));
    res.json(offers.map((offer) => ({
      ...withLiveStatus(offer),
      discountGiven: stats.get(offer.id)?.discountGiven ?? 0,
      ordersWithOffer: stats.get(offer.id)?.orders ?? 0,
    })));
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
      include: {
        OfferProduct: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    res.json(withLiveStatus((await withOfferProductPrices([offer]))[0]!));
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
};

// Create offer (Admin)
export const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, ...restData } = req.body;

    const startDate = parseDate(restData.startDate);
    const endDate = parseDate(restData.endDate);
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Valid start and end dates are required' });
      return;
    }
    if (endDate < startDate) {
      res.status(400).json({ error: 'End date must be on or after start date' });
      return;
    }

    const offer = await prisma.offer.create({
      data: {
        ...stripReadOnlyFields(restData),
        startDate,
        endDate,
        status: deriveStatus(startDate, endDate),
      },
    });

    // Create OfferProduct relationships if productIds are provided
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      await prisma.offerProduct.createMany({
        data: productIds.map((productId: string) => ({
          offerId: offer.id,
          productId,
        })),
      });
    }

    // Fetch the created offer with products
    const offerWithProducts = await prisma.offer.findUnique({
      where: { id: offer.id },
      include: {
        OfferProduct: {
          include: {
            Product: true,
          },
        },
      },
    });

    res.status(201).json(offerWithProducts && withLiveStatus(offerWithProducts));
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

    const { productIds, ...restData } = offerData;
    const updateData: any = stripReadOnlyFields(restData);

    const existing = await prisma.offer.findUnique({
      where: { id },
      select: { startDate: true, endDate: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    // Dates are optional on update; fall back to the stored ones
    const startDate = restData.startDate !== undefined ? parseDate(restData.startDate) : existing.startDate;
    const endDate = restData.endDate !== undefined ? parseDate(restData.endDate) : existing.endDate;
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Invalid start or end date' });
      return;
    }
    if (endDate < startDate) {
      res.status(400).json({ error: 'End date must be on or after start date' });
      return;
    }
    updateData.startDate = startDate;
    updateData.endDate = endDate;
    updateData.status = deriveStatus(startDate, endDate);

    await prisma.offer.update({
      where: { id },
      data: updateData,
    });

    // Update OfferProduct relationships if productIds are provided
    if (productIds !== undefined) {
      // Delete existing relationships
      await prisma.offerProduct.deleteMany({
        where: { offerId: id },
      });

      // Create new relationships
      if (Array.isArray(productIds) && productIds.length > 0) {
        await prisma.offerProduct.createMany({
          data: productIds.map((productId: string) => ({
            offerId: id,
            productId,
          })),
        });
      }
    }

    // Fetch the updated offer with products
    const offerWithProducts = await prisma.offer.findUnique({
      where: { id },
      include: {
        OfferProduct: {
          include: {
            Product: true,
          },
        },
      },
    });

    res.json(offerWithProducts && withLiveStatus(offerWithProducts));
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

    // Validate offer (active window is defined by the dates)
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
