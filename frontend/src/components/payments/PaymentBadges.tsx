import {
  PAYMENT_METHOD_INFO,
  PAYMENT_STATUS_INFO,
  type PaymentMethod,
  type PaymentStatus,
} from '@/src/lib/payments';

export function PaymentMethodBadge({ method }: { method?: PaymentMethod | null }) {
  const info = PAYMENT_METHOD_INFO[method ?? 'COD'];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: info.color }}
    >
      {info.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status?: PaymentStatus | null }) {
  const info = PAYMENT_STATUS_INFO[status ?? 'UNPAID'];
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${info.className}`}>
      {info.label}
    </span>
  );
}
