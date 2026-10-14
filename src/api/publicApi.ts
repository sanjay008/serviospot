import { api } from '@/api/baseApi';
import type { ApiList, ApiRecord, Id, ProviderFilters } from '@/api/types';

export const publicApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getCategories' }),
    }),
    getPlans: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getPlans' }),
    }),
    getLegal: build.query<ApiRecord, 'terms' | 'privacy'>({
      query: (doc) => ({ path: 'serviospot/getLegal', body: { doc } }),
    }),
    getProviders: build.query<ApiList, Pick<ProviderFilters, 'city' | 'guests'> | void>({
      query: (filters) => ({ path: 'serviospot/getProviders', body: filters ?? {} }),
    }),
    searchProviders: build.query<ApiList, ProviderFilters>({
      query: (filters) => ({ path: 'serviospot/searchProviders', body: filters }),
    }),
    getProviderDetails: build.query<ApiRecord, Id>({
      query: (provider_id) => ({ path: 'serviospot/getProviderDetails', body: { provider_id } }),
    }),
    getProviderOfferings: build.query<ApiList, Id>({
      query: (provider_id) => ({ path: 'serviospot/getProviderOfferings', body: { provider_id } }),
    }),
    getProviderReviews: build.query<ApiList, Id>({
      query: (provider_id) => ({ path: 'serviospot/getProviderReviews', body: { provider_id } }),
    }),
    getOffering: build.query<ApiRecord, Id>({
      query: (offering_id) => ({ path: 'serviospot/getOffering', body: { offering_id } }),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetPlansQuery,
  useGetLegalQuery,
  useGetProvidersQuery,
  useSearchProvidersQuery,
  useGetProviderDetailsQuery,
  useGetProviderOfferingsQuery,
  useGetProviderReviewsQuery,
  useGetOfferingQuery,
} = publicApi;
