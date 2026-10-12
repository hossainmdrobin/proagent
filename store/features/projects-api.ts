import { ProjectRecord } from "@/lib/models/Project";
import { baseApi } from "@/store/base-api";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getProjects: build.query<ProjectRecord[], void>({
            query: () => ({ url: "/projects", method: "GET" }),
        }),
    }),
});

export const {
    useGetProjectsQuery
} = authApi;
