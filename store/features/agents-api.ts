import { baseApi } from "@/store/base-api";

export interface Agent {
  id: string;
  name: string;
  role: string;
}

export interface CreateAgentRequest {
  name: string;
  role: string;
}

export const agentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAgents: build.query<Agent[], void>({
      query: () => "/agents",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Agent" as const, id })),
              { type: "Agent" as const, id: "LIST" },
            ]
          : [{ type: "Agent" as const, id: "LIST" }],
    }),
    createAgent: build.mutation<Agent, CreateAgentRequest>({
      query: (body) => ({ url: "/agents", method: "POST", body }),
      invalidatesTags: [{ type: "Agent", id: "LIST" }],
    }),
  }),
});

export const { useGetAgentsQuery, useCreateAgentMutation } = agentsApi;
