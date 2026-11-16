import { API_URL } from '@/api/client';

/** Turns server-relative upload paths into displayable URLs while preserving full/data URLs. */
export function apiMediaUri(value: string | undefined) {
  if (!value) return undefined;
  const uri = value.trim();
  if (!uri) return undefined;
  if (/^(https?:|data:|file:|content:|blob:)/i.test(uri)) return uri;
  if (!API_URL) return uri;
  try {
    return new URL(uri, `${API_URL}/`).toString();
  } catch {
    return uri;
  }
}
