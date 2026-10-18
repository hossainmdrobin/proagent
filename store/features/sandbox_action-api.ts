
import { baseApi } from "@/store/base-api";

type SandboxDetail = {
  state:string,
  url?:string
}

export const sandboxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSandboxState: build.query<SandboxDetail,{projectId:string}>({
      query: ({projectId}) => ({
        url: `/projects/${projectId}/start`,
        method: "GET",
      }),
      providesTags:["SANDBOX"],
    }),
    
    startSandbox: build.mutation<{url:string},{projectId:string}>({
      query: ({projectId}) => ({
        url: `/projects/${projectId}/start`,  // \projects\[projectId]\start\route.ts
        method: "POST",
        body:{projectId}
      }),
      invalidatesTags:["SANDBOX"],
    }),
    stopSandbox: build.mutation<{url:string},{projectId:string}>({
      query: ({projectId}) => ({
        url: `/projects/${projectId}/start`,  // \projects\[projectId]\stop\route.ts
        method: "POST",
        body:{projectId}
      }),
      invalidatesTags:['SANDBOX']
    }),

  }),
});

export const {
  useGetSandboxStateQuery,
  useStartSandboxMutation,
  useStopSandboxMutation
} = sandboxApi;
