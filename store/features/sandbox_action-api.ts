
import { baseApi } from "@/store/base-api";



export const sandboxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // getProjects: build.query<ProjectRecord[], void>({
    //   query: () => ({
    //     url: "/projects",
    //     method: "GET",
    //   }),
    // }),
    
    startSandbox: build.mutation<{url:string},{projectId:string}>({
      query: ({projectId}) => ({
        url: `/projects/${projectId}/start`,  // \projects\[projectId]\start\route.ts
        method: "POST",
        body:{}
      })
    }),
    stopSandbox: build.mutation<{url:string},{projectId:string}>({
      query: ({projectId}) => ({
        url: `/projects/${projectId}/start`,  // \projects\[projectId]\stop\route.ts
        method: "POST",
        body:{}
      })
    }),

  }),
});

export const {
  useStartSandboxMutation,
  useStopSandboxMutation
} = sandboxApi;
