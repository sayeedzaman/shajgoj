import React from 'react';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | StockStatus | UserStatus | string;
  variant?: 'order' | 'payment' | 'stock' | 'user' | 'custom';
}

const orderStatusConfig: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

const paymentStatusConfig: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
  REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Refunded' },
};

const stockStatusConfig: Record<StockStatus, { bg: string; text: string; label: string }> = {
  IN_STOCK: { bg: 'bg-green-100', text: 'text-green-800', label: 'In Stock' },
  LOW_STOCK: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Low Stock' },
  OUT_OF_STOCK: { bg: 'bg-red-100', text: 'text-red-800', label: 'Out of Stock' },
};

const userStatusConfig: Record<UserStatus, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  BANNED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Banned' },
};

export default function StatusBadge({ status, variant = 'custom' }: StatusBadgeProps) {
  let config = { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

  if (variant === 'order' && status in orderStatusConfig) {
    config = orderStatusConfig[status as OrderStatus];
  } else if (variant === 'payment' && status in paymentStatusConfig) {
    config = paymentStatusConfig[status as PaymentStatus];
  } else if (variant === 'stock' && status in stockStatusConfig) {
    config = stockStatusConfig[status as StockStatus];
  } else if (variant === 'user' && status in userStatusConfig) {
    config = userStatusConfig[status as UserStatus];
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
