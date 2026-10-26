interface LinkableOffer {
  id: string;
  linkType?: 'url' | 'product' | string;
  link?: string | null;
  /** Legacy single-product link (older offers) */
  productId?: string | null;
  OfferProduct?: Array<{ Product: { id: string; slug?: string } }>;
}

/**
 * Where an offer banner/card should take the shopper:
 * one product -> its page, several products -> the offer's product list, custom URL -> that URL.
 */
export const getOfferLink = (offer: LinkableOffer): string => {
  if (offer.linkType === 'product') {
    const products = offer.OfferProduct ?? [];
    if (products.length === 1) {
      const product = products[0].Product;
      return `/products/${product.slug || product.id}`;
    }
    if (products.length > 1) return `/offers?offerId=${offer.id}`;
    if (offer.productId) return `/products/${offer.productId}`;
    return '/offers';
  }
  return offer.link || '/offers';
};
