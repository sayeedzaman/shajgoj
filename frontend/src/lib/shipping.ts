// Mirrors backend/src/lib/shipping.ts so the storefront shows the same charge the order will get

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

const amountRuleOn = (s: ShippingSettings) => s.freeShippingEnabled && s.freeShippingThreshold > 0;
const itemRuleOn = (s: ShippingSettings) => s.freeShippingEnabled && s.freeShippingMinItems > 0;

export const qualifiesForFreeShipping = (subtotal: number, totalQuantity: number, s: ShippingSettings) =>
  (amountRuleOn(s) && subtotal >= s.freeShippingThreshold) ||
  (itemRuleOn(s) && totalQuantity >= s.freeShippingMinItems);

/** "Add ৳300 more or 5 more items for FREE shipping!" — null when free or no rule applies */
export const freeShippingHint = (subtotal: number, totalQuantity: number, s: ShippingSettings): string | null => {
  if (qualifiesForFreeShipping(subtotal, totalQuantity, s)) return null;
  const parts: string[] = [];
  if (amountRuleOn(s)) parts.push(`৳${Math.ceil(s.freeShippingThreshold - subtotal)} more`);
  if (itemRuleOn(s)) {
    const items = s.freeShippingMinItems - totalQuantity;
    parts.push(`${items} more item${items === 1 ? '' : 's'}`);
  }
  return parts.length ? `Add ${parts.join(' or ')} for FREE shipping!` : null;
};
