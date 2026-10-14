import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';

import { ApiError, apiPost } from '@/api/client';

export type ApiQuery = { path: string; body?: Record<string, unknown> };
export type ApiFailure = { status: number; message: string };

const baseQuery: BaseQueryFn<ApiQuery, unknown, ApiFailure> = async ({ path, body }) => {
  try {
    return { data: await apiPost(path, body) };
  } catch (error) {
    if (error instanceof ApiError) return { error: { status: error.status, message: error.message } };
    return { error: { status: 0, message: 'Could not reach the server' } };
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
