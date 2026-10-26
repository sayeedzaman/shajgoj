import { Tag } from 'lucide-react';

interface OrderItemPriceProps {
  item: {
    price: number;
    originalPrice?: number | null;
    offerName?: string | null;
  };
  /** Text after the unit price, e.g. " each" */
  suffix?: string;
  className?: string;
}

/** Unit price of an order item; when a product offer applied, shows the pre-offer price struck through and the offer name. */
export default function OrderItemPrice({ item, suffix = '', className = '' }: OrderItemPriceProps) {
  const discounted = item.originalPrice != null && item.originalPrice > item.price;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${className}`}>
      {discounted && <span className="text-gray-400 line-through font-normal">৳{item.originalPrice!.toFixed(0)}</span>}
      <span>৳{item.price.toFixed(0)}{suffix}</span>
      {discounted && item.offerName && (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-900 px-1.5 py-0.5 rounded text-[11px] font-medium">
          <Tag className="w-3 h-3" />
          {item.offerName}
        </span>
      )}
    </span>
  );
}
