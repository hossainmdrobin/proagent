import { ProjectRecord } from "@/lib/models/Project";
import { baseApi } from "@/store/base-api";

export interface RunAgnetResponse {
    result: string
}
export interface RunAgentPayload {
    prompt: string,
    projectId: string
}

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getProjects: build.query<ProjectRecord[], void>({
            query: () => ({ url: "/projects", method: "GET" }),
        }),
        runAgent: build.mutation<RunAgnetResponse, RunAgentPayload>({
            query: (body) => ({
                url: `/projects/${body.projectId}/edit`,
                method: "POST",
                body
            })

        })
    }),
});

export const {
    useGetProjectsQuery
} = authApi;
