export interface ShippingSettings {
  dhakaShippingFee: number;
  outsideDhakaShippingFee: number;
  freeShippingEnabled: boolean;
  /** Order subtotal that earns free shipping; 0 turns the amount rule off */
  freeShippingThreshold: number;
  /** Item count that earns free shipping; 0 turns the item rule off */
  freeShippingMinItems: number;
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  dhakaShippingFee: 60,
  outsideDhakaShippingFee: 120,
  freeShippingEnabled: true,
  freeShippingThreshold: 2000,
  freeShippingMinItems: 20,
};

export const SHIPPING_SETTINGS_SELECT = {
  dhakaShippingFee: true,
  outsideDhakaShippingFee: true,
  freeShippingEnabled: true,
  freeShippingThreshold: true,
  freeShippingMinItems: true,
} as const;

export const qualifiesForFreeShipping = (
  subtotal: number,
  totalQuantity: number,
  settings: ShippingSettings
): boolean => {
  if (!settings.freeShippingEnabled) return false;
  const byAmount = settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const byItems = settings.freeShippingMinItems > 0 && totalQuantity >= settings.freeShippingMinItems;
  return byAmount || byItems;
};

export const calculateShippingCost = (
  subtotal: number,
  totalQuantity: number,
  city: string,
  settings: ShippingSettings
): number => {
  if (qualifiesForFreeShipping(subtotal, totalQuantity, settings)) return 0;
  return city.toLowerCase().includes('dhaka') ? settings.dhakaShippingFee : settings.outsideDhakaShippingFee;
};
