
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

export interface ProjectFileRecord {
  _id: string;
  projectId: string;
  snapshotId: string;
  path: string;
  content: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFilePayload {
  projectId: string;
  path: string;
  content: string;
}

export interface UpdateFilePayload {
  projectId: string;
  fileId: string;
  path: string;
  content: string;
}

export interface DeleteFilePayload {
  projectId: string;
  fileId: string;
}
export interface CreateProjectRequest {
  name:string
}

export const projectApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<ProjectRecord[], void>({
      query: () => ({
        url: "/projects",
        method: "GET",
      }),
    }),
    createProject: build.mutation<ProjectRecord,CreateProjectRequest>({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body
      })
    }),
    getProjectFiles: build.query<ProjectFileRecord[], { projectId: string }>({
      query: ({ projectId }) => `/projects/${projectId}/file`,
      providesTags: ["FILE_CREATE", "FILE_UPDATE", "FILE_DELETE"]
    }),
    createProjectFile: build.mutation<ProjectFileRecord, CreateFilePayload>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/file`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["FILE_CREATE"]
    }),
    updateProjectFile: build.mutation<ProjectFileRecord, UpdateFilePayload>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/file`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["FILE_UPDATE"]
    }),
    deleteProjectFile: build.mutation<{ success: boolean }, DeleteFilePayload>({
      query: ({ projectId, fileId }) => ({
        url: `/projects/${projectId}/file?fileId=${fileId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FILE_DELETE"]
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetProjectFilesQuery,
  useCreateProjectFileMutation,
  useUpdateProjectFileMutation,
  useDeleteProjectFileMutation,
} = projectApi;
