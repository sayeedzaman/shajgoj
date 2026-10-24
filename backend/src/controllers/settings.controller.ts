import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { normalizeBdMobile } from '../lib/payments.js';
import { SHIPPING_SETTINGS_SELECT } from '../lib/shipping.js';

// Shipping numbers the admin can edit: all must be 0 or more, item count must be whole
const SHIPPING_NUMBER_FIELDS = {
  dhakaShippingFee: 'Dhaka delivery charge',
  outsideDhakaShippingFee: 'Outside Dhaka delivery charge',
  freeShippingThreshold: 'Free shipping order amount',
  freeShippingMinItems: 'Free shipping item count',
} as const;

const validateShippingFields = (data: Record<string, unknown>): string | null => {
  for (const [field, label] of Object.entries(SHIPPING_NUMBER_FIELDS)) {
    if (data[field] === undefined) continue;
    const value = Number(data[field]);
    if (data[field] === '' || !Number.isFinite(value) || value < 0) {
      return `${label} must be a number of 0 or more`;
    }
    if (field === 'freeShippingMinItems' && !Number.isInteger(value)) {
      return `${label} must be a whole number`;
    }
    data[field] = value;
  }
  if (data.freeShippingEnabled !== undefined && typeof data.freeShippingEnabled !== 'boolean') {
    return 'Free shipping must be turned on or off';
  }
  return null;
};

const prisma = new PrismaClient();

// Fixed settings ID for singleton pattern
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

// Get store settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: SETTINGS_ID,
          updatedAt: new Date(),
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Get public shipping fees (no admin auth required) so the storefront can
// display accurate delivery charges before an order is placed
export const getPublicShippingSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: SHIPPING_SETTINGS_SELECT,
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: SETTINGS_ID,
          updatedAt: new Date(),
        },
        select: SHIPPING_SETTINGS_SELECT,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    res.status(500).json({ error: 'Failed to fetch shipping settings' });
  }
};

// Get public payment options (no auth required) so checkout knows which
// methods are enabled and which number customers should send money to
export const getPublicPaymentSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const select = {
      cashOnDelivery: true,
      bkashEnabled: true,
      nagadEnabled: true,
      upayEnabled: true,
      rocketEnabled: true,
      mobilePaymentNumber: true,
    } as const;

    let settings = await prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
      select,
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: SETTINGS_ID,
          updatedAt: new Date(),
        },
        select,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
};

// Update store settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsData = req.body;

    const shippingError = validateShippingFields(settingsData);
    if (shippingError) {
      res.status(400).json({ error: shippingError });
      return;
    }

    if (settingsData.mobilePaymentNumber !== undefined) {
      const number = normalizeBdMobile(settingsData.mobilePaymentNumber);
      if (!number) {
        res.status(400).json({ error: 'Please enter a valid Bangladeshi mobile number for payments' });
        return;
      }
      settingsData.mobilePaymentNumber = `+88${number}`;
    }

    // Ensure settings exist first
    let settings = await prisma.storeSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.storeSettings.create({
        data: {
          id: SETTINGS_ID,
          ...settingsData,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.storeSettings.update({
        where: { id: SETTINGS_ID },
        data: settingsData,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
