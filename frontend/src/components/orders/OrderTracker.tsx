'use client';

import { Fragment } from 'react';
import { ShoppingBag, PackageCheck, Truck, Home, Check, XCircle } from 'lucide-react';
import type { OrderStatusHistoryEntry, OrderStatusValue } from '@/src/types/index';

interface OrderTrackerProps {
  status: OrderStatusValue;
  history?: OrderStatusHistoryEntry[];
  createdAt: string;
  /** Smaller, icon-only version for order list cards. */
  compact?: boolean;
}

const STEPS: { key: Exclude<OrderStatusValue, 'CANCELLED'>; label: string; icon: typeof ShoppingBag }[] = [
  { key: 'PENDING', label: 'Confirmed', icon: ShoppingBag },
  { key: 'PROCESSING', label: 'Processing', icon: PackageCheck },
  { key: 'SHIPPED', label: 'In Transit', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

const formatStepTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function OrderTracker({ status, history, createdAt, compact = false }: OrderTrackerProps) {
  if (status === 'CANCELLED') {
    const cancelledAt = history?.find((h) => h.status === 'CANCELLED')?.createdAt;
    return (
      <div className={`flex items-center gap-3 rounded-lg border border-pink-200 bg-pink-50 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
        <XCircle className={`text-pink-600 flex-shrink-0 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <div>
          <p className={`font-semibold text-pink-700 ${compact ? 'text-sm' : 'text-base'}`}>Order Cancelled</p>
          {!compact && cancelledAt && (
            <p className="text-xs text-pink-600">{formatStepTime(cancelledAt)}</p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const colWidth = compact ? 'w-8' : 'w-12 sm:w-16';
  const circleSize = compact ? 'w-7 h-7' : 'w-10 h-10';
  const iconSize = compact ? 'w-3.5 h-3.5' : 'w-5 h-5';

  const timeForStep = (key: string) => {
    if (key === 'PENDING') return createdAt;
    return history?.find((h) => h.status === key)?.createdAt;
  };

  return (
    <div className={compact ? 'py-1' : 'py-2'}>
      {/* Icons + connecting line */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = i < currentIndex;
          const active = i === currentIndex;
          const lineFilled = i < currentIndex;

          return (
            <Fragment key={step.key}>
              <div className={`flex-shrink-0 flex justify-center ${colWidth}`}>
                <div
                  className={`flex items-center justify-center rounded-full border-2 transition-colors ${circleSize} ${
                    done
                      ? 'bg-pink-600 border-pink-600 text-white'
                      : active
                      ? 'bg-pink-50 border-pink-600 text-pink-600 ring-4 ring-pink-100'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {done ? <Check className={iconSize} /> : <Icon className={iconSize} />}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                    lineFilled ? 'bg-pink-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Labels + timestamps */}
      <div className="flex items-start mt-2">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const stepTime = timeForStep(step.key);

          return (
            <Fragment key={step.key}>
              <div className={`flex-shrink-0 flex flex-col items-center text-center ${colWidth}`}>
                <p
                  className={`leading-tight ${compact ? 'text-[10px]' : 'text-xs'} ${
                    active ? 'font-bold text-gray-900' : done ? 'font-medium text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                {!compact && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {stepTime ? formatStepTime(stepTime) : ''}
                  </p>
                )}
              </div>
              {i < STEPS.length - 1 && <div className="flex-1" />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
