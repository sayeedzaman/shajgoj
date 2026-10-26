// Single source of order status labels/colours. PENDING is the stored value for a newly placed order.
export type OrderStatusValue = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

/** Order lifecycle in sequence (admin dropdowns, filters) */
export const ORDER_STATUSES: OrderStatusValue[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const ORDER_STATUS_INFO: Record<OrderStatusValue, { label: string; badge: string }> = {
  PENDING: { label: 'Placed', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  PROCESSING: { label: 'Processing', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  SHIPPED: { label: 'Shipped', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  DELIVERED: { label: 'Delivered', badge: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-pink-100 text-pink-800 border-pink-200' },
};

export const getOrderStatusLabel = (status: string) =>
  ORDER_STATUS_INFO[status as OrderStatusValue]?.label ?? status;
