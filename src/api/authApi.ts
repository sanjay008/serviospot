import { api } from '@/api/baseApi';
import { setAuthToken } from '@/api/client';
import type { ApiRecord, AuthReply, LoginBody, RegisterBody } from '@/api/types';

async function keepToken(queryFulfilled: Promise<{ data: AuthReply }>) {
  try {
    const { data } = await queryFulfilled;
    if (data?.token) await setAuthToken(data.token);
  } catch {
    // The screen shows the error from the mutation result.
  }
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<AuthReply, RegisterBody>({
      query: (body) => ({ path: 'serviospot/register', body }),
      onQueryStarted: (_arg, { queryFulfilled }) => keepToken(queryFulfilled),
    }),
    login: build.mutation<AuthReply, LoginBody>({
      query: (body) => ({ path: 'serviospot/login', body }),
      onQueryStarted: (_arg, { queryFulfilled }) => keepToken(queryFulfilled),
    }),
    logout: build.mutation<ApiRecord, void>({
      query: () => ({ path: 'serviospot/logout' }),
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

export const { useRegisterMutation, useLoginMutation, useLogoutMutation } = authApi;
