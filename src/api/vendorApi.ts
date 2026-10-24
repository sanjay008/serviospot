import { api } from '@/api/baseApi';
import type {
  ApiList,
  ApiRecord,
  AvailabilityBody,
  CalendarBody,
  Id,
  OfferingBody,
  PlanName,
  PreferencesBody,
  ProposalBody,
  TemplateBody,
  VendorProfileBody,
  VerificationBody,
} from '@/api/types';

export type OnboardingOption = { code: string; label_nl: string; label_en: string };
export type VendorOnboardingOptions = {
  provider_types: OnboardingOption[];
  fulfilments: OnboardingOption[];
  cuisines: OnboardingOption[];
  cuisine_styles: OnboardingOption[];
  capabilities: OnboardingOption[];
};
export type VendorOnboardingBody = ApiRecord & {
  email: string;
  profile_name: string;
  provider_type: 'private' | 'business';
  street: string;
  house_number?: string;
  postcode: string;
  city: string;
  delivery: boolean;
  pickup: boolean;
  onsite: boolean;
  radius_km: number;
  cuisines: string[];
  cuisine_styles: string[];
  capabilities: string[];
  lead_days: number;
  description: string;
  from_price: string;
  trial_consent: boolean;
  terms: boolean;
};
export type VendorOffering = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  price_cents?: number | string | null;
  is_active?: boolean | null;
};
export type VendorOfferingsReply = { offerings?: VendorOffering[]; limit?: number } & ApiRecord;

export const vendorApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOnboardingOptions: build.mutation<VendorOnboardingOptions, { company_login: string }>({
      query: (body) => ({ path: 'api/serviospot/getOnboardingOptions', body }),
    }),
    saveVendorOnboarding: build.mutation<ApiRecord, VendorOnboardingBody>({
      query: (body) => ({ path: 'api/serviospot/saveVendorOnboarding', body }),
      invalidatesTags: ['VendorProfile', 'Dashboard'],
    }),
    getSubscription: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/getSubscription' }),
      providesTags: ['Subscription'],
    }),
    saveSubscription: build.mutation<ApiRecord, PlanName>({
      query: (plan) => ({ path: 'serviospot/saveSubscription', body: { plan } }),
      invalidatesTags: ['Subscription', 'Me', 'Dashboard'],
    }),
    getInvoices: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getInvoices' }),
      providesTags: ['Subscription'],
    }),
    saveVendorServices: build.mutation<ApiRecord, string[]>({
      query: (services) => ({ path: 'serviospot/saveVendorServices', body: { services } }),
      invalidatesTags: ['VendorProfile'],
    }),
    getVendorDashboard: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/getVendorDashboard' }),
      providesTags: ['Dashboard'],
    }),
    getLeads: build.query<ApiList, 'new' | 'sent' | 'picked' | void>({
      query: (filter) => ({ path: 'serviospot/getLeads', body: filter ? { filter } : {} }),
      providesTags: ['Lead'],
    }),
    getLead: build.query<ApiRecord, Id>({
      query: (lead_id) => ({ path: 'serviospot/getLead', body: { lead_id } }),
      providesTags: ['Lead'],
    }),
    saveAvailability: build.mutation<ApiRecord, AvailabilityBody>({
      query: (body) => ({ path: 'serviospot/saveAvailability', body }),
      invalidatesTags: ['Lead', 'Dashboard'],
    }),
    saveProposal: build.mutation<ApiRecord, ProposalBody>({
      query: (body) => ({ path: 'serviospot/saveProposal', body }),
      invalidatesTags: ['Lead', 'Dashboard'],
    }),
    withdrawProposal: build.mutation<ApiRecord, Id>({
      query: (proposal_id) => ({ path: 'serviospot/withdrawProposal', body: { proposal_id } }),
      invalidatesTags: ['Lead', 'Dashboard'],
    }),
    getVendorOfferings: build.query<VendorOfferingsReply, void>({
      query: () => ({ path: 'api/serviospot/getVendorOfferings' }),
      providesTags: ['VendorOffering'],
    }),
    saveOffering: build.mutation<ApiRecord, OfferingBody>({
      query: (body) => ({ path: 'serviospot/saveOffering', body }),
      invalidatesTags: ['VendorOffering'],
    }),
    updateOffering: build.mutation<ApiRecord, Partial<OfferingBody> & { offering_id: Id }>({
      query: (body) => ({ path: 'serviospot/updateOffering', body }),
      invalidatesTags: ['VendorOffering'],
    }),
    setOfferingActive: build.mutation<ApiRecord, { offering_id: Id; active: boolean }>({
      query: (body) => ({ path: 'serviospot/setOfferingActive', body }),
      invalidatesTags: ['VendorOffering'],
    }),
    getVendorProfile: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/getVendorProfile' }),
      providesTags: ['VendorProfile'],
    }),
    updateVendorProfile: build.mutation<ApiRecord, VendorProfileBody>({
      query: (body) => ({ path: 'serviospot/updateVendorProfile', body }),
      invalidatesTags: ['VendorProfile'],
    }),
    saveVerification: build.mutation<ApiRecord, VerificationBody>({
      query: (body) => ({ path: 'serviospot/saveVerification', body }),
      invalidatesTags: ['VendorProfile'],
    }),
    getPreferences: build.query<PreferencesBody, void>({
      query: () => ({ path: 'serviospot/getPreferences' }),
      providesTags: ['Preferences'],
    }),
    savePreferences: build.mutation<ApiRecord, PreferencesBody>({
      query: (body) => ({ path: 'serviospot/savePreferences', body }),
      invalidatesTags: ['Preferences', 'Lead'],
    }),
    getCalendar: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getCalendar' }),
      providesTags: ['Calendar'],
    }),
    saveCalendar: build.mutation<ApiRecord, CalendarBody>({
      query: (body) => ({ path: 'serviospot/saveCalendar', body }),
      invalidatesTags: ['Calendar'],
    }),
    getTemplates: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getTemplates' }),
      providesTags: ['Template'],
    }),
    saveTemplate: build.mutation<ApiRecord, TemplateBody>({
      query: (body) => ({ path: 'serviospot/saveTemplate', body }),
      invalidatesTags: ['Template'],
    }),
    deleteTemplate: build.mutation<ApiRecord, Id>({
      query: (template_id) => ({ path: 'serviospot/deleteTemplate', body: { template_id } }),
      invalidatesTags: ['Template'],
    }),
    getAnalytics: build.query<ApiRecord, void>({
      query: () => ({ path: 'serviospot/getAnalytics' }),
      providesTags: ['Dashboard'],
    }),
    getVendorReviews: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getVendorReviews' }),
      providesTags: ['Review'],
    }),
    saveReviewResponse: build.mutation<ApiRecord, { review_id: Id; response: string }>({
      query: (body) => ({ path: 'serviospot/saveReviewResponse', body }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetOnboardingOptionsMutation,
  useSaveVendorOnboardingMutation,
  useGetSubscriptionQuery,
  useSaveSubscriptionMutation,
  useGetInvoicesQuery,
  useSaveVendorServicesMutation,
  useGetVendorDashboardQuery,
  useGetLeadsQuery,
  useGetLeadQuery,
  useSaveAvailabilityMutation,
  useSaveProposalMutation,
  useWithdrawProposalMutation,
  useGetVendorOfferingsQuery,
  useSaveOfferingMutation,
  useUpdateOfferingMutation,
  useSetOfferingActiveMutation,
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useSaveVerificationMutation,
  useGetPreferencesQuery,
  useSavePreferencesMutation,
  useGetCalendarQuery,
  useSaveCalendarMutation,
  useGetTemplatesQuery,
  useSaveTemplateMutation,
  useDeleteTemplateMutation,
  useGetAnalyticsQuery,
  useGetVendorReviewsQuery,
  useSaveReviewResponseMutation,
} = vendorApi;
