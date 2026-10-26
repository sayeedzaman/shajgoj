import type { Offer } from '@prisma/client';
import { prisma } from './prisma.js';

/**
 * Automatic product offers: while an offer is running, every product linked to it
 * (via OfferProduct) sells at the offer price. Applied server-side so product pages,
 * cart, checkout and the charged order total all agree.
 */

export interface AppliedOffer {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
}

interface PricedProduct {
  id: string;
  price: number;
  salePrice: number | null;
}

export type WithOfferPrice<T extends PricedProduct> = T & {
  /** Store sale price before the offer was applied */
  regularSalePrice: number | null;
  appliedOffer: AppliedOffer | null;
};

const isOfferUsable = (offer: Offer) => offer.usageLimit <= 0 || offer.usageCount < offer.usageLimit;

/** Price of one unit after an offer, rounded to whole taka and never below 0 */
export const calculateOfferPrice = (basePrice: number, offer: Pick<Offer, 'discountType' | 'discountValue' | 'maxDiscount'>) => {
  let discount = offer.discountType === 'PERCENTAGE'
    ? (basePrice * offer.discountValue) / 100
    : offer.discountValue;
  if (offer.discountType === 'PERCENTAGE' && offer.maxDiscount && offer.maxDiscount > 0) {
    discount = Math.min(discount, offer.maxDiscount);
  }
  return Math.max(0, Math.round(basePrice - discount));
};

/** Running offers for each product id (an offer runs from its start date to its end date) */
const getActiveOffersByProduct = async (productIds: string[]) => {
  const byProduct = new Map<string, Offer[]>();
  if (productIds.length === 0) return byProduct;

  const now = new Date();
  const links = await prisma.offerProduct.findMany({
    where: {
      productId: { in: [...new Set(productIds)] },
      Offer: { startDate: { lte: now }, endDate: { gte: now } },
    },
    include: { Offer: true },
  });

  for (const { productId, Offer: offer } of links) {
    if (!isOfferUsable(offer)) continue;
    byProduct.set(productId, [...(byProduct.get(productId) ?? []), offer]);
  }
  return byProduct;
};

/**
 * Returns the products with `salePrice` set to the best running offer price (when it beats the
 * store's own sale price). `price` stays the original price so the storefront can strike it through.
 */
export const applyOfferPricing = async <T extends PricedProduct>(products: T[]): Promise<WithOfferPrice<T>[]> => {
  const offersByProduct = await getActiveOffersByProduct(products.map((p) => p.id));

  return products.map((product) => {
    const basePrice = product.salePrice || product.price;
    let best: { price: number; offer: Offer } | null = null;

    for (const offer of offersByProduct.get(product.id) ?? []) {
      const price = calculateOfferPrice(basePrice, offer);
      if (price < basePrice && (!best || price < best.price)) best = { price, offer };
    }

    return {
      ...product,
      salePrice: best ? best.price : product.salePrice,
      regularSalePrice: product.salePrice,
      appliedOffer: best
        ? { id: best.offer.id, name: best.offer.name, discountType: best.offer.discountType, discountValue: best.offer.discountValue }
        : null,
    };
  });
};

export const applyOfferPricingOne = async <T extends PricedProduct>(product: T): Promise<WithOfferPrice<T>> =>
  (await applyOfferPricing([product]))[0]!;
