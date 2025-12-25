import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

// Get all active offers (Public)
export const getActiveOffers = async (req: AuthRequest, res: Response) => {
  try {
    const { type, displayOnHomepage } = req.query;

    const now = new Date();
    const where: any = {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (type) {
      where.type = type;
    }

    if (displayOnHomepage === 'true') {
      where.displayOnHomepage = true;
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ offers });
  } catch (error) {
    console.error('Get active offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// Get single offer by ID or code (Public)
export const getOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ error: 'Offer identifier is required' });
    }

    const offer = await prisma.offer.findFirst({
      where: {
        OR: [
          { id: identifier },
          { code: identifier },
        ],
      },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({ offer });
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
};

// Validate and apply offer code (Public/Authenticated)
export const validateOfferCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Offer code is required' });
    }

    const offer = await prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Invalid offer code' });
    }

    const now = new Date();

    // Check if offer is active
    if (offer.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This offer is no longer active' });
    }

    // Check date validity
    if (now < offer.startDate) {
      return res.status(400).json({ error: 'This offer has not started yet' });
    }

    if (now > offer.endDate) {
      return res.status(400).json({ error: 'This offer has expired' });
    }

    // Check usage limit
    if (offer.usageLimit > 0 && offer.usageCount >= offer.usageLimit) {
      return res.status(400).json({ error: 'This offer has reached its usage limit' });
    }

    // Check minimum purchase
    if (cartTotal && cartTotal < offer.minPurchase) {
      return res.status(400).json({
        error: `Minimum purchase of ${offer.minPurchase} required for this offer`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (offer.discountType === 'PERCENTAGE') {
      discountAmount = (cartTotal * offer.discountValue) / 100;
      if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
        discountAmount = offer.maxDiscount;
      }
    } else if (offer.discountType === 'FIXED') {
      discountAmount = offer.discountValue;
    }

    res.json({
      valid: true,
      offer: {
        id: offer.id,
        name: offer.name,
        code: offer.code,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        maxDiscount: offer.maxDiscount,
      },
      discountAmount,
      finalAmount: cartTotal ? Math.max(0, cartTotal - discountAmount) : 0,
    });
  } catch (error) {
    console.error('Validate offer code error:', error);
    res.status(500).json({ error: 'Failed to validate offer code' });
  }
};

// Apply offer (increment usage count)
export const applyOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { offerId } = req.body;

    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    res.json({
      message: 'Offer applied successfully',
      usageCount: offer.usageCount,
    });
  } catch (error) {
    console.error('Apply offer error:', error);
    res.status(500).json({ error: 'Failed to apply offer' });
  }
};

// Admin: Get all offers with filters and pagination
export const getAllOffers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNum,
    });

    const totalOffers = await prisma.offer.count({ where });

    res.json({
      offers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalOffers,
        totalPages: Math.ceil(totalOffers / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all offers error:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

// Admin: Create new offer
export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      code,
      description,
      imageUrl,
      linkType,
      link,
      productId,
      type,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      displayOnHomepage,
      priority,
      backgroundColor,
      textColor,
      badgeColor,
      borderStyle,
      cardStyle,
    } = req.body;

    // Validation
    if (!name || !code || !type || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Name, code, type, discount type, discount value, start date, and end date are required'
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({ error: 'Discount value must be greater than 0' });
    }

    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check if code already exists
    const existingOffer = await prisma.offer.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingOffer) {
      return res.status(400).json({ error: 'Offer code already exists' });
    }

    // Determine status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    let status = 'ACTIVE';

    if (now < start) {
      status = 'SCHEDULED';
    } else if (now > end) {
      status = 'EXPIRED';
    }

    const offer = await prisma.offer.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        imageUrl,
        linkType: linkType || 'url',
        link,
        productId,
        type,
        discountType,
        discountValue,
        minPurchase: minPurchase || 0,
        maxDiscount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: usageLimit || 0,
        status,
        displayOnHomepage: displayOnHomepage !== undefined ? displayOnHomepage : true,
        priority: priority || 0,
        backgroundColor,
        textColor,
        badgeColor,
        borderStyle,
        cardStyle,
      },
    });

    res.status(201).json({
      message: 'Offer created successfully',
      offer,
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
};

// Admin: Update offer
export const updateOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const updateData = req.body;

    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }

    // Check if offer exists
    const existingOffer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!existingOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingOffer.code) {
      const codeExists = await prisma.offer.findUnique({
        where: { code: updateData.code.toUpperCase() },
      });

      if (codeExists) {
        return res.status(400).json({ error: 'Offer code already exists' });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Validate discount value
    if (updateData.discountValue !== undefined) {
      if (updateData.discountValue <= 0) {
        return res.status(400).json({ error: 'Discount value must be greater than 0' });
      }

      const discountType = updateData.discountType || existingOffer.discountType;
      if (discountType === 'PERCENTAGE' && updateData.discountValue > 100) {
        return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
      }
    }

    // Validate dates
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : existingOffer.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : existingOffer.endDate;

      if (startDate >= endDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
    });

    res.json({
      message: 'Offer updated successfully',
      offer,
    });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
};

// Admin: Delete offer
export const deleteOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { offerId } = req.params;

    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    await prisma.offer.delete({
      where: { id: offerId },
    });

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Failed to delete offer' });
  }
};

// Admin: Update offer status
export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is required' });
    }

    if (!status || !['ACTIVE', 'EXPIRED', 'SCHEDULED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (ACTIVE, EXPIRED, SCHEDULED)' });
    }

    const offer = await prisma.offer.update({
      where: { id: offerId },
      data: { status },
    });

    res.json({
      message: 'Offer status updated successfully',
      offer,
    });
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({ error: 'Failed to update offer status' });
  }
};

// Admin: Get offer statistics
export const getOfferStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    // Total offers
    const totalOffers = await prisma.offer.count();

    // Active offers
    const activeOffers = await prisma.offer.count({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Scheduled offers
    const scheduledOffers = await prisma.offer.count({
      where: {
        status: 'SCHEDULED',
        startDate: { gt: now },
      },
    });

    // Expired offers
    const expiredOffers = await prisma.offer.count({
      where: {
        OR: [
          { status: 'EXPIRED' },
          { endDate: { lt: now } },
        ],
      },
    });

    // Offers by type
    const offersByType = await prisma.offer.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    // Most used offers
    const mostUsedOffers = await prisma.offer.findMany({
      where: {
        usageCount: { gt: 0 },
      },
      orderBy: {
        usageCount: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        code: true,
        usageCount: true,
        usageLimit: true,
      },
    });

    // Total usage
    const totalUsage = await prisma.offer.aggregate({
      _sum: {
        usageCount: true,
      },
    });

    res.json({
      totalOffers,
      activeOffers,
      scheduledOffers,
      expiredOffers,
      offersByType: offersByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      mostUsedOffers,
      totalUsage: totalUsage._sum.usageCount || 0,
    });
  } catch (error) {
    console.error('Get offer stats error:', error);
    res.status(500).json({ error: 'Failed to fetch offer statistics' });
  }
};

// Cron job or scheduled task to auto-update offer statuses
export const updateExpiredOffers = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    // Mark expired offers
    const expiredResult = await prisma.offer.updateMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        endDate: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Activate scheduled offers
    const activatedResult = await prisma.offer.updateMany({
      where: {
        status: 'SCHEDULED',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      data: {
        status: 'ACTIVE',
      },
    });

    res.json({
      message: 'Offer statuses updated successfully',
      expired: expiredResult.count,
      activated: activatedResult.count,
    });
  } catch (error) {
    console.error('Update expired offers error:', error);
    res.status(500).json({ error: 'Failed to update offer statuses' });
  }
};
