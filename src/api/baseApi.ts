import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { apiRequest, type ApiMethod } from '@/api/client';

export type ApiQuery = {
  path: string;
  method?: ApiMethod;
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  auth?: boolean;
};
export type ApiFailure = { status: number; message: string };

const baseQuery: BaseQueryFn<ApiQuery, unknown, ApiFailure> = async (args, { signal }) => {
  try {
    const data = await apiRequest(args.path, args.body, { method: args.method, params: args.params, headers: args.headers, signal, auth: args.auth });
    return { data };
  } catch (error) {
    return {
      error: {
        status: error && typeof error === 'object' && 'status' in error ? Number(error.status) || 0 : 0,
        message: error instanceof Error ? error.message : 'Could not reach the server.',
      },
    };
  }
};

// Each area adds its own endpoints with injectEndpoints (publicApi, authApi, accountApi, customerApi, chatApi, vendorApi).
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Me',
    'Notification',
    'NotificationSettings',
    'Favorite',
    'Request',
    'Proposal',
    'Contact',
    'Conversation',
    'Message',
    'Subscription',
    'Dashboard',
    'Lead',
    'VendorOffering',
    'VendorProfile',
    'Preferences',
    'Calendar',
    'Template',
    'Review',
  ],
  endpoints: () => ({}),
});
