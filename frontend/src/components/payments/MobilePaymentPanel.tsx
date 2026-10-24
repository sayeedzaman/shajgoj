'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Smartphone } from 'lucide-react';
import {
  PAYMENT_METHOD_INFO,
  formatPaymentNumber,
  toLocalNumber,
  type MobilePaymentMethod,
} from '@/src/lib/payments';

interface MobilePaymentPanelProps {
  method: MobilePaymentMethod;
  amount: number;
  paymentNumber: string;
  sender: string;
  trxId: string;
  onSenderChange: (value: string) => void;
  onTrxIdChange: (value: string) => void;
}

/**
 * Manual mobile banking flow: customer sends money to the store's number
 * (by number or by scanning the QR), then enters their wallet number and TrxID.
 */
export default function MobilePaymentPanel({
  method,
  amount,
  paymentNumber,
  sender,
  trxId,
  onSenderChange,
  onTrxIdChange,
}: MobilePaymentPanelProps) {
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null);
  const info = PAYMENT_METHOD_INFO[method];
  const localNumber = toLocalNumber(paymentNumber);
  const amountText = amount.toFixed(0);

  const copy = async (text: string, what: 'number' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); the value is still visible to copy manually
    }
  };

  return (
    <div className="mt-4 rounded-lg border-2 p-4 sm:p-5" style={{ borderColor: info.color }}>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* QR */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <QRCodeSVG value={localNumber} size={148} level="M" marginSize={0} />
          </div>
          <p className="text-xs text-gray-500 text-center max-w-[170px]">
            Scan to get the {info.label} number
          </p>
        </div>

        {/* Instructions */}
        <div className="flex-1 min-w-0 space-y-3">
          {info.logo && (
            // eslint-disable-next-line @next/next/no-img-element -- small static logo, no optimization needed
            <img src={info.logo} alt={info.label} className="h-9 w-auto object-contain" />
          )}
          <div>
            <p className="text-sm text-gray-600">Send Money to this {info.label} number</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold tracking-wide" style={{ color: info.color }}>
                {formatPaymentNumber(paymentNumber)}
              </span>
              <button
                type="button"
                onClick={() => copy(localNumber, 'number')}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                title="Copy number"
              >
                {copied === 'number' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Amount to send</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-gray-900">৳{amountText}</span>
              <button
                type="button"
                onClick={() => copy(amountText, 'amount')}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                title="Copy amount"
              >
                {copied === 'amount' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
            <li>
              Open the {info.label} app{info.ussd && <> or dial <span className="font-semibold">{info.ussd}</span></>} and choose{' '}
              <span className="font-semibold">Send Money</span>
            </li>
            <li>Enter the number above and the exact amount, then confirm with your PIN</li>
            <li>Enter your {info.label} number and the Transaction ID (TrxID) from the confirmation SMS below</li>
          </ol>
        </div>
      </div>

      {/* Customer's payment details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-200">
        <div>
          <label htmlFor="paymentSender" className="block text-sm font-medium text-gray-700 mb-1">
            Your {info.label} Number *
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="paymentSender"
              type="tel"
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              value={sender}
              onChange={(e) => onSenderChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label htmlFor="paymentTrxId" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID (TrxID) *
          </label>
          <input
            id="paymentTrxId"
            type="text"
            placeholder="e.g. 9BC4D7XYZ1"
            value={trxId}
            onChange={(e) => onTrxIdChange(e.target.value.toUpperCase().replace(/\s/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        We&apos;ll confirm your payment and then start processing your order.
      </p>
    </div>
  );
}
