import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://app.erpportaal.nl/api';

// Public calls are rejected without this. Set EXPO_PUBLIC_COMPANY_LOGIN in .env.
export const COMPANY_LOGIN = process.env.EXPO_PUBLIC_COMPANY_LOGIN ?? '';

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

type Envelope<T> = {
  status_code?: number;
  status?: boolean;
  message?: string;
  data?: T;
};

const LOG_LIMIT = 2000;
let logCount = 0;

/** Hides secrets at any depth, in what is sent and in what comes back. */
function mask(key: string, value: unknown) {
  if (typeof value !== 'string') return value;
  if (key === 'password') return '***';
  if (key === 'token') return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : '***';
  if (value.startsWith('data:')) return `${value.slice(0, value.indexOf(',') + 1)}… (${Math.round(value.length / 1024)} KB)`;
  return value;
}

function preview(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, mask, 2);
  if (text === undefined) return 'undefined';
  return text.length > LOG_LIMIT ? `${text.slice(0, LOG_LIMIT)}… (+${text.length - LOG_LIMIT} chars)` : text;
}

/** Logs a request in dev builds and returns a function that logs its reply. Shows in the Metro terminal. */
type ReplyLogger = (status: number | string, reply: unknown, failed?: boolean) => void;

export function startApiLog(url: string, body: Record<string, unknown>): ReplyLogger {
  if (!__DEV__) return () => {};
  const id = ++logCount;
  const started = Date.now();
  console.log(`[API #${id}] → POST ${url}\nSEND ${preview(body)}`);
  return (status, reply, failed = false) => {
    console.log(
      `[API #${id}] ${failed ? '✗ FAIL' : '← OK'} ${status} ${url} (${Date.now() - started} ms)\nREPLY ${preview(reply)}`,
    );
  };
}

/** Every ServioSpot call is a POST. The token, or company_login when signed out, goes in the body. */
export async function apiPost<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const payload: Record<string, unknown> = { ...body };
  if (authToken) payload.token = authToken;
  else payload.company_login = COMPANY_LOGIN;

  const url = `${API_URL}/${path}`;
  const logReply = startApiLog(url, payload);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    logReply('NETWORK', String(error), true);
    throw error;
  }

  const text = await response.text();
  let json: Envelope<T> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Envelope<T>;
    } catch {
      logReply(response.status, text, true);
      throw new ApiError('The server sent a reply the app could not read.', response.status);
    }
  }

  const status = json?.status_code ?? response.status;
  if (!response.ok || json?.status === false) {
    logReply(status, json, true);
    throw new ApiError(json?.message || `Request failed (${status})`, status);
  }
  logReply(status, json);
  return json?.data as T;
}
