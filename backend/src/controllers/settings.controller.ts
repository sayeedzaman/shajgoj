import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

// Update store settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settingsData = req.body;

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
