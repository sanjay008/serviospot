import * as WebBrowser from 'expo-web-browser';

import type { ApiRecord } from '@/api/types';

export const MOLLIE_RETURN_PATH = 'payment/mollie';

/** Deep link the backend contract expects Mollie to open after checkout. */
export const MOLLIE_RETURN_URL = 'serviospot://payment/mollie';

export function mollieReturnUrl() {
  return MOLLIE_RETURN_URL;
}

function text(record: ApiRecord | null | undefined, ...keys: string[]) {
  if (!record) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

/** Reads the checkout URL from our API or a raw Mollie payment object. */
export function checkoutUrlOf(data: ApiRecord | null | undefined) {
  const direct = text(data, 'checkout_url', 'checkoutUrl', 'url');
  if (direct) return direct;
  const links = data?._links;
  if (links && typeof links === 'object' && !Array.isArray(links)) {
    const checkout = (links as ApiRecord).checkout;
    if (checkout && typeof checkout === 'object' && !Array.isArray(checkout)) {
      return text(checkout as ApiRecord, 'href');
    }
  }
  return '';
}

export function paymentIdOf(data: ApiRecord | null | undefined) {
  return text(data, 'payment_id', 'mollie_id', 'id');
}

export function paymentStatusOf(data: ApiRecord | null | undefined) {
  return text(data, 'status', 'payment_status').toLowerCase();
}

export function paymentPlanOf(data: ApiRecord | null | undefined) {
  const direct = text(data, 'plan', 'code').toLowerCase();
  if (direct === 'gold' || direct === 'platinum' || direct === 'free') return direct;
  const nested = data?.plan;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const code = text(nested as ApiRecord, 'code', 'plan', 'name').toLowerCase();
    if (code === 'gold' || code === 'platinum' || code === 'free') return code;
  }
  return '';
}

let pendingCheckout: { paymentId: string; plan: string } | null = null;
let successPlan: string | null = null;
const successListeners = new Set<() => void>();

/** Remember the checkout that is in progress so the return screen can confirm it. */
export function rememberMollieCheckout(paymentId: string, plan: string) {
  pendingCheckout = { paymentId, plan };
}

export function currentMollieCheckout() {
  return pendingCheckout;
}

export function planLabel(value: string) {
  const code = value.trim().toLowerCase();
  if (code === 'gold') return 'Gold';
  if (code === 'platinum') return 'Platinum';
  if (code === 'free') return 'Free';
  if (!value.trim()) return '';
  return value.trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Shows the success popup on the vendor profile, including after the return route closes. */
export function publishMollieSuccess(plan: string) {
  successPlan = planLabel(plan) || 'Your plan';
  successListeners.forEach((listener) => listener());
}

export function currentMollieSuccess() {
  return successPlan;
}

export function clearMollieSuccess() {
  successPlan = null;
  successListeners.forEach((listener) => listener());
}

export function subscribeMollieSuccess(listener: () => void) {
  successListeners.add(listener);
  return () => {
    successListeners.delete(listener);
  };
}

/** Opens Mollie hosted checkout and resolves when the vendor returns to the app. */
export async function openMollieCheckout(checkoutUrl: string) {
  return WebBrowser.openAuthSessionAsync(checkoutUrl, mollieReturnUrl());
}
