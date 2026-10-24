export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'UPAY' | 'ROCKET';
export type MobilePaymentMethod = Exclude<PaymentMethod, 'COD'>;
export type PaymentStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PaymentSettings {
  cashOnDelivery: boolean;
  bkashEnabled: boolean;
  nagadEnabled: boolean;
  upayEnabled: boolean;
  rocketEnabled: boolean;
  mobilePaymentNumber: string;
}

export const DEFAULT_PAYMENT_NUMBER = '+8801835286271';

export const MOBILE_PAYMENT_METHODS: MobilePaymentMethod[] = ['BKASH', 'NAGAD', 'UPAY', 'ROCKET'];

export const isMobilePayment = (method: PaymentMethod | undefined | null): method is MobilePaymentMethod =>
  !!method && method !== 'COD';

export const PAYMENT_SETTING_FIELD: Record<PaymentMethod, keyof Omit<PaymentSettings, 'mobilePaymentNumber'>> = {
  COD: 'cashOnDelivery',
  BKASH: 'bkashEnabled',
  NAGAD: 'nagadEnabled',
  UPAY: 'upayEnabled',
  ROCKET: 'rocketEnabled',
};

interface PaymentMethodInfo {
  label: string;
  /** Brand color used for the badge / accent */
  color: string;
  /** USSD code for customers without the app */
  ussd?: string;
  /** Official logo in /public/payments */
  logo?: string;
}

export const PAYMENT_METHOD_INFO: Record<PaymentMethod, PaymentMethodInfo> = {
  COD: { label: 'Cash on Delivery', color: '#4B5563' },
  BKASH: { label: 'bKash', color: '#E2136E', ussd: '*247#', logo: '/payments/bkash.png' },
  NAGAD: { label: 'Nagad', color: '#EC1C24', ussd: '*167#', logo: '/payments/nagad.png' },
  UPAY: { label: 'Upay', color: '#0054A6', ussd: '*268#', logo: '/payments/upay.png' },
  ROCKET: { label: 'Rocket', color: '#8C3494', ussd: '*322#', logo: '/payments/rocket.png' },
};

export const getPaymentMethodLabel = (method: PaymentMethod | undefined | null) =>
  PAYMENT_METHOD_INFO[method ?? 'COD']?.label ?? 'Cash on Delivery';

interface PaymentStatusInfo {
  label: string;
  className: string;
}

export const PAYMENT_STATUS_INFO: Record<PaymentStatus, PaymentStatusInfo> = {
  UNPAID: { label: 'Unpaid', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  PENDING_VERIFICATION: { label: 'Verifying Payment', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  PAID: { label: 'Paid', className: 'bg-green-100 text-green-800 border-green-200' },
  FAILED: { label: 'Payment Failed', className: 'bg-pink-100 text-pink-800 border-pink-200' },
  REFUNDED: { label: 'Refunded', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

/** "+8801835286271" -> "01835286271" (the form customers type into Send Money) */
export const toLocalNumber = (number: string) => number.replace(/^\+?88/, '');

/** "+8801835286271" -> "01835-286271" for display */
export const formatPaymentNumber = (number: string) => {
  const local = toLocalNumber(number);
  return local.length === 11 ? `${local.slice(0, 5)}-${local.slice(5)}` : local;
};

/** Mirrors backend validation (01XXXXXXXXX, optional +88 prefix) */
export const isValidBdMobile = (value: string) => {
  let digits = value.replace(/[\s-]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('880')) digits = digits.slice(2);
  return /^01[3-9]\d{8}$/.test(digits);
};

export const isValidTrxId = (value: string) => /^[A-Z0-9]{6,30}$/.test(value.trim().toUpperCase());
