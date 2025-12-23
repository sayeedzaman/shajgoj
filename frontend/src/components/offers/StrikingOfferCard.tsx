'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Tag, Gift } from 'lucide-react';

export interface StrikingOfferCardProps {
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
    // Style customization options
    backgroundColor?: string;
    textColor?: string;
    badgeColor?: string;
    borderStyle?: 'wavy' | 'rounded' | 'sharp' | 'irregular';
    cardStyle?: 'gradient' | 'solid' | 'image';
  };
}

export default function StrikingOfferCard({ offer }: StrikingOfferCardProps) {
  // Determine the link
  const getLink = () => {
    if (offer.linkType === 'product' && offer.productId) {
      return `/products/${offer.productId}`;
    }
    return offer.link || '/offers';
  };

  // Default colors if not provided
  const bgColor = offer.backgroundColor || 'from-red-500 via-pink-500 to-rose-600';
  const textColor = offer.textColor || 'text-white';
  const badgeColor = offer.badgeColor || 'bg-yellow-400 text-red-900';
  const borderStyle = offer.borderStyle || 'wavy';

  // Border style classes
  const getBorderClass = () => {
    switch (borderStyle) {
      case 'wavy':
        return 'rounded-[30px_10px_30px_10px]';
      case 'rounded':
        return 'rounded-3xl';
      case 'sharp':
        return 'rounded-none';
      case 'irregular':
        return 'rounded-[40px_20px_50px_15px]';
      default:
        return 'rounded-3xl';
    }
  };

  // Background style
  const getBackgroundClass = () => {
    if (offer.cardStyle === 'solid') {
      // For solid, extract the first color from gradient string or use as-is
      const solidColor = bgColor.includes('from-')
        ? bgColor.split(' ')[0].replace('from-', 'bg-')
        : (offer.backgroundColor || 'bg-pink-500');
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
      className={`group relative overflow-hidden ${getBorderClass()} ${getBackgroundClass()}
        shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105
        min-h-[280px] flex flex-col justify-between p-6 ${textColor}`}
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

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Discount Badge */}
        <div className={`inline-flex items-center gap-2 ${badgeColor} px-4 py-2 rounded-full font-bold text-sm mb-4 shadow-lg`}>
          <Sparkles className="w-4 h-4" />
          {offer.discountType === 'PERCENTAGE'
            ? `${offer.discountValue}% OFF`
            : `৳${offer.discountValue} OFF`}
        </div>

        {/* Offer Name */}
        <h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight drop-shadow-lg">
          {offer.name}
        </h3>

        {/* Description */}
        {offer.description && (
          <p className="text-base md:text-lg font-semibold opacity-90 mb-4 line-clamp-2">
            {offer.description}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <div className="relative z-10 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-3 rounded-full font-bold text-sm transition-all group-hover:bg-white/30 group-hover:scale-110">
          <span>Shop Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Icon based on discount type */}
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
          {offer.discountType === 'PERCENTAGE' ? (
            <Tag className="w-6 h-6" />
          ) : (
            <Gift className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* Animated Border Glow */}
      <div className="absolute inset-0 border-2 border-white/20 group-hover:border-white/40 transition-all rounded-[inherit]" />
    </Link>
  );
}
