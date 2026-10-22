import { api } from '@/api/baseApi';
import { setAuthToken } from '@/api/client';
import type { ApiRecord, AuthReply, LoginBody, RegisterBody } from '@/api/types';

export type OtpStartBody = {
  company_login?: string;
  email?: string;
  country_code?: string;
  whatsapp_number?: string;
  role: 'customer' | 'vendor';
};

export type OtpStartReply = {
  user: { id: string | number; verify_token: string; [key: string]: unknown };
  type: string;
  role: 'customer' | 'vendor';
  [key: string]: unknown;
};

export type OtpVerifyBody = { token: string; user_id: string | number; otp: string; otp_type: string; role: 'customer' | 'vendor' };
export type OtpVerifyReply = { user: ApiRecord & { id?: string | number; verify_token?: string; role?: string }; relaties?: unknown } & ApiRecord;

export type ResendOtpBody = { company_login: string; user_id: string | number; otp_type: string };

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
    companyLogin: build.mutation<ApiRecord, { company_login: string }>({
      query: (body) => ({ path: 'api/company_login', body, auth: false }),
    }),
    loginNew: build.mutation<OtpStartReply, OtpStartBody>({
      query: (body) => ({ path: 'api/login_new', body, auth: false }),
    }),
    verifyOtpNew: build.mutation<OtpVerifyReply, OtpVerifyBody>({
      query: (body) => ({ path: 'api/verify_otp_new', body, auth: false }),
    }),
    resendOtp: build.mutation<ApiRecord, ResendOtpBody>({
      query: (body) => ({ path: 'api/resend_otp', body, auth: false }),
    }),
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

export const { useCompanyLoginMutation, useLoginNewMutation, useVerifyOtpNewMutation, useResendOtpMutation, useRegisterMutation, useLoginMutation, useLogoutMutation } = authApi;
