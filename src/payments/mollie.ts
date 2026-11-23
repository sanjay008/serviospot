import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { ApiRecord } from '@/api/types';

export const MOLLIE_RETURN_PATH = 'payment/mollie';

/** Deep link Mollie sends the vendor back to after checkout. */
export function mollieReturnUrl() {
  return Linking.createURL(MOLLIE_RETURN_PATH);
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

/** Opens Mollie hosted checkout and resolves when the vendor returns to the app. */
export async function openMollieCheckout(checkoutUrl: string) {
  return WebBrowser.openAuthSessionAsync(checkoutUrl, mollieReturnUrl());
}
