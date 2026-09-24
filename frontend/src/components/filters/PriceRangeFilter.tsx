'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_MAX = 1_000_000;
const SLIDER_STEP = 1000;
/** Fetch shortly after user pauses typing (no need to blur). */
const INPUT_DEBOUNCE_MS = 400;

export type PriceRangeValue = [number, number];

interface PriceRangeFilterProps {
  value: PriceRangeValue;
  onChange: (value: PriceRangeValue) => void;
  max?: number;
  title?: string;
}

/**
 * Local draft UI for price inputs + dual range slider.
 * Parent `onChange` (API fetch) runs when:
 * - user pauses typing in min/max (~400ms debounce)
 * - number inputs blur / Enter
 * - range thumb is released (mouseup / touchend / keyup)
 */
export default function PriceRangeFilter({
  value,
  onChange,
  max = DEFAULT_MAX,
  title = 'Price Range',
}: PriceRangeFilterProps) {
  const [draft, setDraft] = useState<PriceRangeValue>(value);
  const [minText, setMinText] = useState(String(value[0]));
  const [maxText, setMaxText] = useState(String(value[1]));
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const draftRef = useRef<PriceRangeValue>(value);
  const valueRef = useRef<PriceRangeValue>(value);
  const minTextRef = useRef(minText);
  const maxTextRef = useRef(maxText);
  const minFocusedRef = useRef(false);
  const maxFocusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  valueRef.current = value;
  minTextRef.current = minText;
  maxTextRef.current = maxText;
  minFocusedRef.current = minFocused;
  maxFocusedRef.current = maxFocused;

  const setDraftBoth = (next: PriceRangeValue) => {
    draftRef.current = next;
    setDraft(next);
  };

  const clearDebounce = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  // Sync from parent when filter is cleared / reset externally
  useEffect(() => {
    draftRef.current = value;
    setDraft(value);
    if (!minFocusedRef.current) setMinText(String(value[0]));
    if (!maxFocusedRef.current) setMaxText(String(value[1]));
  }, [value]);

  useEffect(() => () => clearDebounce(), []);

  const commit = (next: PriceRangeValue, opts?: { syncTexts?: boolean }) => {
    const clamped: PriceRangeValue = [
      Math.max(0, Math.min(next[0], next[1], max)),
      Math.max(0, Math.min(Math.max(next[0], next[1]), max)),
    ];
    setDraftBoth(clamped);

    const syncTexts = opts?.syncTexts ?? true;
    if (syncTexts) {
      if (!minFocusedRef.current) setMinText(String(clamped[0]));
      if (!maxFocusedRef.current) setMaxText(String(clamped[1]));
    }

    const current = valueRef.current;
    if (clamped[0] !== current[0] || clamped[1] !== current[1]) {
      onChange(clamped);
    }
  };

  const commitDraft = () => {
    clearDebounce();
    commit(draftRef.current);
  };

  const commitFromTexts = (syncTexts = true) => {
    const minRaw = minTextRef.current.trim();
    const maxRaw = maxTextRef.current.trim();
    let newMin = minRaw === '' ? 0 : parseInt(minRaw, 10);
    let newMax = maxRaw === '' ? max : parseInt(maxRaw, 10);
    if (!Number.isFinite(newMin)) newMin = 0;
    if (!Number.isFinite(newMax)) newMax = max;
    newMin = Math.max(0, Math.min(newMin, max));
    newMax = Math.max(0, Math.min(newMax, max));
    if (newMin > newMax) {
      if (minFocusedRef.current) newMin = newMax;
      else newMax = newMin;
    }
    commit([newMin, newMax], { syncTexts });
  };

  const scheduleCommitFromInputs = () => {
    clearDebounce();
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      // Keep typed text while focused so multi-digit entry stays smooth
      commitFromTexts(false);
    }, INPUT_DEBOUNCE_MS);
  };

  const thumbClass =
    'absolute top-0 w-full appearance-none bg-transparent pointer-events-none ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none ' +
    '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-pink-600 ' +
    '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer ' +
    '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none ' +
    '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-pink-600 ' +
    '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer ' +
    '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md';

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Min</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minText}
                onFocus={() => setMinFocused(true)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  setMinText(raw);
                  minTextRef.current = raw;
                  if (raw !== '') {
                    const n = parseInt(raw, 10);
                    if (Number.isFinite(n)) {
                      setDraftBoth([Math.min(n, draftRef.current[1]), draftRef.current[1]]);
                    }
                  }
                  scheduleCommitFromInputs();
                }}
                onBlur={() => {
                  clearDebounce();
                  commitFromTexts(true);
                  setMinFocused(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    clearDebounce();
                    commitFromTexts(true);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Minimum price"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Max</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxText}
                onFocus={() => setMaxFocused(true)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  setMaxText(raw);
                  maxTextRef.current = raw;
                  if (raw !== '') {
                    const n = parseInt(raw, 10);
                    if (Number.isFinite(n)) {
                      setDraftBoth([draftRef.current[0], Math.max(n, draftRef.current[0])]);
                    }
                  }
                  scheduleCommitFromInputs();
                }}
                onBlur={() => {
                  clearDebounce();
                  commitFromTexts(true);
                  setMaxFocused(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    clearDebounce();
                    commitFromTexts(true);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>

        <div className="relative h-2">
          <div className="absolute w-full h-2 bg-gray-200 rounded-lg" />
          <div
            className="absolute h-2 bg-pink-600 rounded-lg"
            style={{
              left: `${(draft[0] / max) * 100}%`,
              right: `${100 - (draft[1] / max) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={max}
            step={SLIDER_STEP}
            value={draft[0]}
            onChange={(e) => {
              const newMin = Math.min(parseInt(e.target.value, 10), draftRef.current[1]);
              setDraftBoth([newMin, draftRef.current[1]]);
              setMinText(String(newMin));
            }}
            onMouseUp={commitDraft}
            onTouchEnd={commitDraft}
            onKeyUp={commitDraft}
            className={thumbClass}
            style={{ height: '8px' }}
            aria-label="Minimum price slider"
          />
          <input
            type="range"
            min={0}
            max={max}
            step={SLIDER_STEP}
            value={draft[1]}
            onChange={(e) => {
              const newMax = Math.max(parseInt(e.target.value, 10), draftRef.current[0]);
              setDraftBoth([draftRef.current[0], newMax]);
              setMaxText(String(newMax));
            }}
            onMouseUp={commitDraft}
            onTouchEnd={commitDraft}
            onKeyUp={commitDraft}
            className={thumbClass}
            style={{ height: '8px' }}
            aria-label="Maximum price slider"
          />
        </div>
      </div>
    </div>
  );
}
