import type { PaymentMethod, PaymentStatus } from '@prisma/client';

export const PAYMENT_METHODS: PaymentMethod[] = ['COD', 'BKASH', 'NAGAD', 'UPAY', 'ROCKET'];
export const MOBILE_PAYMENT_METHODS: PaymentMethod[] = ['BKASH', 'NAGAD', 'UPAY', 'ROCKET'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED'];

export const isMobilePayment = (method: PaymentMethod) => MOBILE_PAYMENT_METHODS.includes(method);

// StoreSettings toggle for each method
export const PAYMENT_SETTING_FIELD = {
  COD: 'cashOnDelivery',
  BKASH: 'bkashEnabled',
  NAGAD: 'nagadEnabled',
  UPAY: 'upayEnabled',
  ROCKET: 'rocketEnabled',
} as const satisfies Record<PaymentMethod, string>;

/**
 * Normalizes a Bangladeshi mobile number to 01XXXXXXXXX.
 * Accepts +8801..., 8801..., 01..., with spaces or dashes. Returns null if invalid.
 */
export const normalizeBdMobile = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  let digits = value.replace(/[\s-]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('880')) digits = digits.slice(2);
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
};

/** Transaction IDs are alphanumeric (bKash/Nagad/Upay use letters+digits, Rocket uses digits). */
export const normalizeTrxId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trxId = value.trim().toUpperCase();
  return /^[A-Z0-9]{6,30}$/.test(trxId) ? trxId : null;
};
