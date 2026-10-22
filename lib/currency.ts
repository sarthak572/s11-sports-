'use client';

import { useSyncExternalStore } from 'react';
import siteData from '@/data/site.json';
import { Product } from '@/types';

export type Currency = 'INR' | 'CAD';

// Canadian IANA time zones. Visitors in one of these see Canadian dollars by default;
// everyone else sees rupees. The header switch overrides this and is remembered.
const CANADIAN_TIME_ZONES = new Set([
  'America/St_Johns', 'America/Halifax', 'America/Glace_Bay', 'America/Moncton', 'America/Goose_Bay',
  'America/Blanc-Sablon', 'America/Toronto', 'America/Montreal', 'America/Nipigon', 'America/Thunder_Bay',
  'America/Iqaluit', 'America/Pangnirtung', 'America/Atikokan', 'America/Winnipeg', 'America/Rainy_River',
  'America/Resolute', 'America/Rankin_Inlet', 'America/Regina', 'America/Swift_Current', 'America/Edmonton',
  'America/Cambridge_Bay', 'America/Yellowknife', 'America/Inuvik', 'America/Creston', 'America/Dawson_Creek',
  'America/Fort_Nelson', 'America/Whitehorse', 'America/Dawson', 'America/Vancouver',
]);

const STORAGE_KEY = 'currency';
let chosen: Currency | null = null; // fallback when localStorage is unavailable
const listeners = new Set<() => void>();

function detectCurrency(): Currency {
  if (chosen) return chosen;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'INR' || saved === 'CAD') return saved;
  } catch {}
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  return CANADIAN_TIME_ZONES.has(timeZone) || timeZone.startsWith('Canada/') ? 'CAD' : 'INR';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function setCurrency(currency: Currency) {
  chosen = currency;
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {}
  listeners.forEach((l) => l());
}

// Static pages are pre-rendered in rupees; the visitor's currency is applied after load.
export function useCurrency(): Currency {
  return useSyncExternalStore(subscribe, detectCurrency, () => 'INR');
}

// Uses the CAD price from the sheet when set; otherwise converts the rupee price at the
// fixed rate in site.json, rounded up to whole dollars.
export function productPrice(product: Pick<Product, 'price' | 'priceCad' | 'compareAtPrice'>, currency: Currency) {
  if (currency === 'INR') return { price: product.price, compareAtPrice: product.compareAtPrice };
  const toCad = (inr: number) => (product.priceCad ? Math.round((inr * product.priceCad) / product.price) : Math.ceil(inr / siteData.currency.inrPerCad));
  return {
    price: product.priceCad ?? toCad(product.price),
    compareAtPrice: product.compareAtPrice ? toCad(product.compareAtPrice) : null,
  };
}

export function formatPrice(amount: number, currency: Currency) {
  return currency === 'INR'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
}
