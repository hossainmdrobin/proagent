import { baseApi } from "@/store/base-api";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  projectId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface ListConversationsResponse {
  conversations: ConversationRecord[];
}

export interface GetConversationResponse {
  conversation: ConversationRecord;
}

export interface CreateConversationResponse {
  conversation: ConversationRecord;
}

export const conversationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConversations: build.query<
      ListConversationsResponse,
      { projectId: string }
    >({
      query: ({ projectId }) => ({
        url: `/projects/${projectId}/conversations`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map((c) => ({
                type: "CONVERSATION" as const,
                id: c.id,
              })),
              { type: "CONVERSATION" as const, id: "LIST" },
            ]
          : [{ type: "CONVERSATION" as const, id: "LIST" }],
    }),
    getConversation: build.query<
      GetConversationResponse,
      { projectId: string; conversationId: string }
    >({
      query: ({ projectId, conversationId }) => ({
        url: `/projects/${projectId}/conversations/${conversationId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { conversationId }) => [
        { type: "CONVERSATION" as const, id: conversationId },
      ],
    }),
    createConversation: build.mutation<
      CreateConversationResponse,
      { projectId: string } & CreateConversationRequest
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/conversations`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "CONVERSATION" as const, id: "LIST" }],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
} = conversationsApi;