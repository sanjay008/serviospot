import { api } from '@/api/baseApi';
import type { ApiList, ApiRecord, Id } from '@/api/types';

export const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    getConversations: build.query<ApiList, void>({
      query: () => ({ path: 'serviospot/getConversations' }),
      providesTags: ['Conversation'],
    }),
    getMessages: build.query<ApiList, Id>({
      query: (conversation_id) => ({ path: 'serviospot/getMessages', body: { conversation_id } }),
      providesTags: (_result, _error, id) => [{ type: 'Message', id }],
    }),
    sendMessage: build.mutation<ApiRecord, { conversation_id: Id; message: string }>({
      query: (body) => ({ path: 'serviospot/sendMessage', body }),
      invalidatesTags: (_result, _error, { conversation_id }) => [{ type: 'Message', id: conversation_id }, 'Conversation'],
    }),
  }),
});

export const { useGetConversationsQuery, useGetMessagesQuery, useSendMessageMutation } = chatApi;
