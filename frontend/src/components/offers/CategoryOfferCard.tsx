'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export interface CategoryOfferCardProps {
  offer: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    productId?: string;
    linkType?: 'url' | 'product';
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    // Style customization
    backgroundColor?: string;
    textColor?: string;
    badgeColor?: string;
    borderStyle?: 'wavy' | 'rounded' | 'sharp' | 'irregular';
    cardStyle?: 'gradient' | 'solid' | 'image';
  };
}

export default function CategoryOfferCard({ offer }: CategoryOfferCardProps) {
  // Determine the link
  const getLink = () => {
    if (offer.linkType === 'product' && offer.productId) {
      return `/products/${offer.productId}`;
    }
    return offer.link || '/offers';
  };

  // Default colors if not provided
  const bgColor = offer.backgroundColor || 'from-red-400 via-red-500 to-rose-600';
  const textColor = offer.textColor || 'text-white';
  const badgeColor = offer.badgeColor || 'bg-white/90 backdrop-blur-sm text-red-600';
  const borderStyle = offer.borderStyle || 'wavy';

  // Border style classes
  const getBorderClass = () => {
    switch (borderStyle) {
      case 'wavy':
        return 'rounded-[25px_10px_25px_10px]';
      case 'rounded':
        return 'rounded-3xl';
      case 'sharp':
        return 'rounded-none';
      case 'irregular':
        return 'rounded-[40px_20px_50px_15px]';
      default:
        return 'rounded-[25px_10px_25px_10px]';
    }
  };

  // Background style
  const getBackgroundClass = () => {
    if (offer.cardStyle === 'solid') {
      // For solid, extract the first color from gradient string or use as-is
      const solidColor = bgColor.includes('from-')
        ? bgColor.split(' ')[0].replace('from-', 'bg-')
        : (offer.backgroundColor || 'bg-pink-400');
      return solidColor;
    } else if (offer.cardStyle === 'image' && offer.imageUrl) {
      return 'bg-cover bg-center';
    }
    // Default gradient
    return `bg-gradient-to-br ${bgColor}`;
  };

  return (
    <Link
      href={getLink()}
      className="group block"
    >
      <div
        className={`relative overflow-hidden ${getBorderClass()} ${getBackgroundClass()}
        shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]
        min-h-[200px] p-6 flex flex-col justify-between`}
        style={
          offer.cardStyle === 'image' && offer.imageUrl
            ? { backgroundImage: `url(${offer.imageUrl})` }
            : {}
        }
      >
        {/* Overlay for image background to ensure text readability */}
        {offer.cardStyle === 'image' && offer.imageUrl && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        )}

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10">
          {/* Category Image (if provided and not using image card style) */}
          {offer.imageUrl && offer.cardStyle !== 'image' && (
            <div className="mb-4 relative w-20 h-20 mx-auto">
              <Image
                src={offer.imageUrl}
                alt={offer.name}
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          )}

          {/* Offer Name */}
          <h3 className={`text-2xl md:text-3xl font-black mb-2 text-center leading-tight ${textColor} drop-shadow-lg uppercase tracking-wide`}>
            {offer.name}
          </h3>

          {/* Description */}
          {offer.description && (
            <p className={`text-sm md:text-base font-semibold text-center opacity-90 mb-3 ${textColor}`}>
              {offer.description}
            </p>
          )}

          {/* Discount Badge */}
          <div className="flex justify-center">
            <div className={`inline-flex ${badgeColor} px-4 py-2 rounded-full`}>
              <span className="font-black text-lg">
                {offer.discountType === 'PERCENTAGE'
                  ? `${offer.discountValue}% OFF`
                  : `৳${offer.discountValue} OFF`}
              </span>
            </div>
          </div>
        </div>

        {/* Shop Now Indicator */}
        <div className="relative z-10 mt-4 flex justify-center">
          <div className={`flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full font-bold text-sm ${textColor} transition-all group-hover:bg-white/30 group-hover:scale-110`}>
            <span>Explore</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Border glow effect */}
        <div className={`absolute inset-0 border-2 border-white/30 group-hover:border-white/50 transition-all ${getBorderClass()}`} />
      </div>
    </Link>
  );
}
