import { api } from '@/api/baseApi';
import type { ApiList, ApiRecord, Id, OutcomeBody, RequestBody, ReviewBody } from '@/api/types';

export const customerApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFavorites: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getFavorites' }),
      providesTags: ['Favorite'],
    }),
    saveFavorite: build.mutation<ApiRecord, { type: 'provider' | 'offering'; id: Id }>({
      query: (body) => ({ path: 'serviospot/saveFavorite', body }),
      invalidatesTags: ['Favorite'],
    }),
    deleteFavorite: build.mutation<ApiRecord, Id>({
      query: (favorite_id) => ({ path: 'serviospot/deleteFavorite', body: { favorite_id } }),
      invalidatesTags: ['Favorite'],
    }),
    saveRequestDraft: build.mutation<ApiRecord, Partial<RequestBody>>({
      query: (body) => ({ path: 'serviospot/saveRequestDraft', body }),
    }),
    submitRequest: build.mutation<ApiRecord, RequestBody>({
      query: (body) => ({ path: 'serviospot/submitRequest', body }),
      invalidatesTags: ['Request'],
    }),
    getRequests: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getRequests' }),
      providesTags: ['Request'],
    }),
    getRequestDetails: build.query<ApiRecord, Id>({
      query: (request_id) => ({ path: 'serviospot/getRequestDetails', body: { request_id } }),
      providesTags: ['Request'],
    }),
    cancelRequest: build.mutation<ApiRecord, { request_id: Id; reason: string }>({
      query: (body) => ({ path: 'serviospot/cancelRequest', body }),
      invalidatesTags: ['Request'],
    }),
    getProposals: build.query<ApiList, Id>({
      query: (request_id) => ({ path: 'serviospot/getProposals', body: { request_id } }),
      providesTags: ['Proposal'],
    }),
    getProposal: build.query<ApiRecord, Id>({
      query: (proposal_id) => ({ path: 'serviospot/getProposal', body: { proposal_id } }),
      providesTags: ['Proposal'],
    }),
    continueWithProvider: build.mutation<ApiRecord, Id>({
      query: (proposal_id) => ({ path: 'serviospot/continueWithProvider', body: { proposal_id } }),
      invalidatesTags: ['Proposal', 'Request', 'Contact'],
    }),
    getReleasedContacts: build.query<ApiList, Id>({
      query: (request_id) => ({ path: 'serviospot/getReleasedContacts', body: { request_id } }),
      providesTags: ['Contact'],
    }),
    saveOutcome: build.mutation<ApiRecord, OutcomeBody>({
      query: (body) => ({ path: 'serviospot/saveOutcome', body }),
      invalidatesTags: ['Request'],
    }),
    saveReview: build.mutation<ApiRecord, ReviewBody>({
      query: (body) => ({ path: 'serviospot/saveReview', body }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useSaveFavoriteMutation,
  useDeleteFavoriteMutation,
  useSaveRequestDraftMutation,
  useSubmitRequestMutation,
  useGetRequestsQuery,
  useGetRequestDetailsQuery,
  useCancelRequestMutation,
  useGetProposalsQuery,
  useGetProposalQuery,
  useContinueWithProviderMutation,
  useGetReleasedContactsQuery,
  useSaveOutcomeMutation,
  useSaveReviewMutation,
} = customerApi;
