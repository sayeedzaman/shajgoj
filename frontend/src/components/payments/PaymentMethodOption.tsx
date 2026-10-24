import { Check } from 'lucide-react';
import { PAYMENT_METHOD_INFO, type MobilePaymentMethod } from '@/src/lib/payments';

interface PaymentMethodOptionProps {
  method: MobilePaymentMethod;
  selected: boolean;
  onSelect: () => void;
  name?: string;
}

/** Selectable wallet tile showing the provider's logo (radio input for keyboard/screen readers). */
export default function PaymentMethodOption({ method, selected, onSelect, name = 'payment' }: PaymentMethodOptionProps) {
  const info = PAYMENT_METHOD_INFO[method];

  return (
    <label
      className={`relative flex items-center justify-center h-16 px-3 rounded-lg border-2 bg-white cursor-pointer transition-all focus-within:ring-2 focus-within:ring-pink-300 ${
        selected ? 'shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      style={selected ? { borderColor: info.color, backgroundColor: `${info.color}0D` } : undefined}
    >
      <input
        type="radio"
        name={name}
        value={method}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {info.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- small static logo, no optimization needed
        <img src={info.logo} alt={info.label} className="max-h-10 max-w-full object-contain" />
      ) : (
        <span className="font-bold" style={{ color: info.color }}>{info.label}</span>
      )}
      {selected && (
        <span
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow"
          style={{ backgroundColor: info.color }}
        >
          <Check className="w-3 h-3" />
        </span>
      )}
    </label>
  );
}
