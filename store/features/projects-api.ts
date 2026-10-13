
import type { ProjectRecord } from "@/lib/models/Project";
import { baseApi } from "@/store/base-api";

export interface RunAgentResponse {
  success: boolean;
  projectId: string;
  version: number;
  message: string;
}

export interface RunAgentPayload {
  projectId: string;
  prompt: string;
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<ProjectRecord[], void>({
      query: () => ({
        url: "/projects",
        method: "GET",
      }),
    }),
    getProjectFiles: build.query({
      query: ({projectId}) => `/projects/${projectId}/file`
    }),

    runAgent: build.mutation<RunAgentResponse, RunAgentPayload>({
      query: ({ projectId, prompt }) => ({
        url: `/projects/${projectId}/edit`,
        method: "POST",
        body: { prompt },
      }),
    }),

  }),
});

export const {
  useGetProjectsQuery,
  useRunAgentMutation,
  useGetProjectFilesQuery
} = projectApi;
