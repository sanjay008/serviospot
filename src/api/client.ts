import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiAuthMode = 'body' | 'bearer' | 'none';

/** Set these in a local .env file or the matching EAS environment. Calls stay off by default. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
export const API_ENABLED = process.env.EXPO_PUBLIC_API_ENABLED === 'true';
export const API_AUTH_MODE = (process.env.EXPO_PUBLIC_API_AUTH_MODE ?? 'body') as ApiAuthMode;
export const COMPANY_LOGIN = (process.env.EXPO_PUBLIC_COMPANY_LOGIN ?? 'catering').trim() || 'catering';

const TOKEN_KEY = 'authToken';
const canUseStorage = () => Platform.OS !== 'web' || typeof window !== 'undefined';

let authToken: string | null = null;

export function getAuthToken() {
  return authToken;
}

export async function setAuthToken(token: string | null) {
  authToken = token;
  if (!canUseStorage()) return;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function restoreAuthToken() {
  if (!canUseStorage()) return null;
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const LOG_LIMIT = 2000;
let logCount = 0;
const SECRET_FIELDS = /^(password|token|authorization|company_login|email|phone|phone_number|full_name|name|photo|logo|image|code|otp)$/i;

/** Avoid putting credentials, personal details, or full image data in Metro logs. */
function mask(key: string, value: unknown) {
  if (typeof value !== 'string') return value;
  if (SECRET_FIELDS.test(key)) return '***';
  if (value.startsWith('data:')) return `${value.slice(0, value.indexOf(',') + 1)}… (${Math.round(value.length / 1024)} KB)`;
  return value;
}

function preview(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, mask, 2);
  if (text === undefined) return 'undefined';
  return text.length > LOG_LIMIT ? `${text.slice(0, LOG_LIMIT)}… (+${text.length - LOG_LIMIT} chars)` : text;
}

type ReplyLogger = (status: number | string, reply: unknown, failed?: boolean) => void;

/** Development-only request and response trace. Sensitive values are masked before logging. */
export function startApiLog(method: ApiMethod, url: string, body: unknown): ReplyLogger {
  if (!__DEV__) return () => {};
  const id = ++logCount;
  const started = Date.now();
  console.log(`[API #${id}] → ${method} ${url}\nSEND ${preview(body)}`);
  return (status, reply, failed = false) => {
    console.log(`[API #${id}] ${failed ? '✗ FAIL' : '← OK'} ${status} ${url} (${Date.now() - started} ms)\nREPLY ${preview(reply)}`);
  };
}

function responseMessage(reply: unknown, fallback: string) {
  if (reply && typeof reply === 'object') {
    const record = reply as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
    if (typeof record.error === 'string' && record.error.trim()) return record.error;
  }
  return fallback;
}

/** Shared REST transport. Endpoint files own paths/types; this function owns HTTP and auth behavior. */
export async function apiRequest<T>(
  path: string,
  body: Record<string, unknown> = {},
  options: {
    method?: ApiMethod;
    params?: Record<string, string | number | boolean | null | undefined>;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    /** Skip the saved session token for public authentication requests. */
    auth?: boolean;
  } = {},
): Promise<T> {
  if (!API_ENABLED) throw new ApiError('API calls are disabled. Set EXPO_PUBLIC_API_ENABLED=true when the backend is ready.', 0);
  if (!API_URL) throw new ApiError('API URL is missing. Set EXPO_PUBLIC_API_URL before enabling API calls.', 0);
  if (!['body', 'bearer', 'none'].includes(API_AUTH_MODE)) throw new ApiError('Invalid EXPO_PUBLIC_API_AUTH_MODE. Use body, bearer, or none.', 0);

  const method = options.method ?? 'POST';
  let normalizedPath = path.replace(/^\/+/, '');
  // Auth routes include `/api` for a host-only base URL. Existing app
  // configuration may already include that segment, so keep it only once.
  if (/\/api$/i.test(API_URL) && /^api\//i.test(normalizedPath)) normalizedPath = normalizedPath.slice(4);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const queryString = query.toString();
  const url = `${API_URL}/${normalizedPath}${queryString ? `?${queryString}` : ''}`;
  const payload: Record<string, unknown> = { ...body };
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };

  if (method !== 'GET' && method !== 'DELETE') headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  if (options.auth !== false) {
    if (API_AUTH_MODE === 'body' && authToken) payload.token = authToken;
    else if (API_AUTH_MODE === 'body' && !authToken && COMPANY_LOGIN) payload.company_login = COMPANY_LOGIN;
    if (API_AUTH_MODE === 'bearer' && authToken) headers.Authorization = `Bearer ${authToken}`;
  }

  const logReply = startApiLog(method, url, method === 'GET' || method === 'DELETE' ? undefined : payload);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      ...(method === 'GET' || method === 'DELETE' ? {} : { body: JSON.stringify(payload) }),
      signal: options.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reach the server.';
    logReply('NETWORK', message, true);
    throw new ApiError(message, 0);
  }

  const text = await response.text();
  let reply: unknown = undefined;
  if (text) {
    try {
      reply = JSON.parse(text) as unknown;
    } catch {
      logReply(response.status, text, true);
      throw new ApiError('The server sent a reply the app could not read.', response.status);
    }
  }

  const record = reply && typeof reply === 'object' ? reply as Record<string, unknown> : null;
  const statusRejected = record?.status === false;
  if (!response.ok || statusRejected) {
    const message = responseMessage(reply, `Request failed (${response.status}).`);
    const status = typeof record?.status_code === 'number' ? record.status_code : response.status;
    logReply(status, reply, true);
    throw new ApiError(message, status);
  }

  logReply(response.status, reply);
  return (record && Object.prototype.hasOwnProperty.call(record, 'data') ? record.data : reply) as T;
}

/** Backward-compatible POST helper for existing action code. */
export function apiPost<T>(path: string, body: Record<string, unknown> = {}) {
  return apiRequest<T>(path, body, { method: 'POST' });
}
