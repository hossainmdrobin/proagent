
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
  snapshotId: string;
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

export const projectApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<ProjectRecord[], void>({
      query: () => ({
        url: "/projects",
        method: "GET",
      }),
    }),
    getProjectFiles: build.query<ProjectFileRecord[], { projectId: string }>({
      query: ({ projectId }) => `/projects/${projectId}/file`,
    }),
    createProjectFile: build.mutation<ProjectFileRecord, CreateFilePayload>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/file`,
        method: "POST",
        body,
      }),
    }),
    updateProjectFile: build.mutation<ProjectFileRecord, UpdateFilePayload>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/file`,
        method: "PUT",
        body,
      }),
    }),
    deleteProjectFile: build.mutation<{ success: boolean }, DeleteFilePayload>({
      query: ({ projectId, fileId }) => ({
        url: `/projects/${projectId}/file?fileId=${fileId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectFilesQuery,
  useCreateProjectFileMutation,
  useUpdateProjectFileMutation,
  useDeleteProjectFileMutation,
} = projectApi;
