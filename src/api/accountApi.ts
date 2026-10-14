import { api } from '@/api/baseApi';
import { setAuthToken } from '@/api/client';
import type { ApiList, ApiRecord, Id, NotificationSettingsBody, ReportBody } from '@/api/types';

export const accountApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/me' }),
      providesTags: ['Me'],
    }),
    verifyPhone: build.mutation<ApiRecord, { phone: string }>({
      query: (body) => ({ path: 'serviospot/verifyPhone', body }),
      invalidatesTags: ['Me'],
    }),
    verifyEmail: build.mutation<ApiRecord, void>({
      query: () => ({ path: 'serviospot/verifyEmail' }),
      invalidatesTags: ['Me'],
    }),
    savePushToken: build.mutation<ApiRecord, { expo_token: string }>({
      query: (body) => ({ path: 'serviospot/savePushToken', body }),
    }),
    getNotifications: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getNotifications' }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/getUnreadCount' }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: build.mutation<ApiRecord, Id>({
      query: (notification_id) => ({ path: 'serviospot/markNotificationRead', body: { notification_id } }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: build.mutation<ApiRecord, void>({
      query: () => ({ path: 'serviospot/markAllNotificationsRead' }),
      invalidatesTags: ['Notification'],
    }),
    getNotificationSettings: build.query<NotificationSettingsBody, void>({
      query: () => ({ path: 'serviospot/getNotificationSettings' }),
      providesTags: ['NotificationSettings'],
    }),
    updateNotificationSettings: build.mutation<ApiRecord, NotificationSettingsBody>({
      query: (body) => ({ path: 'serviospot/updateNotificationSettings', body }),
      invalidatesTags: ['NotificationSettings'],
    }),
    saveReport: build.mutation<ApiRecord, ReportBody>({
      query: (body) => ({ path: 'serviospot/saveReport', body }),
    }),
    exportAccount: build.mutation<ApiRecord, void>({
      query: () => ({ path: 'serviospot/exportAccount' }),
    }),
    deleteAccount: build.mutation<ApiRecord, void>({
      query: () => ({ path: 'serviospot/deleteAccount' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          // The screen shows the error and keeps the session.
          return;
        }
        await setAuthToken(null);
        dispatch(api.util.resetApiState());
      },
    }),
  }),
});

export const {
  useGetMeQuery,
  useVerifyPhoneMutation,
  useVerifyEmailMutation,
  useSavePushTokenMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSaveReportMutation,
  useExportAccountMutation,
  useDeleteAccountMutation,
} = accountApi;
