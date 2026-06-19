import type { components } from './types.gen'

// Convenience aliases over the generated OpenAPI types.
// The underlying shapes come from `pnpm gen:api` (see types.gen.ts).

export type ApiUser = components['schemas']['User']
export type ApiProject = components['schemas']['Project']
export type ApiTask = components['schemas']['Task']
export type ApiProjectMember = components['schemas']['ProjectMember']
export type ApiProjectStatus = components['schemas']['ProjectStatus']
export type ApiCompleteTaskResp = components['schemas']['CompleteTaskResp']
export type ApiRemoveMemberOutput = components['schemas']['RemoveMemberOutputBody']
export type ApiError = components['schemas']['ErrorModel']

export type ApiCreateProjectBody = components['schemas']['CreateProjectBody']
export type ApiUpdateProjectBody = components['schemas']['UpdateProjectBody']
export type ApiCreateTaskBody = components['schemas']['CreateTaskBody']
export type ApiCreateSubtaskBody = components['schemas']['CreateSubtaskBody']
export type ApiUpdateTaskBody = components['schemas']['UpdateTaskBody']
export type ApiCompleteTaskBody = components['schemas']['CompleteTaskBody']
export type ApiAddMemberBody = components['schemas']['AddMemberBody']
export type ApiUpdateMemberBody = components['schemas']['UpdateMemberBody']
export type ApiAddStatusBody = components['schemas']['AddStatusBody']
export type ApiAddTagBody = components['schemas']['AddTagBody']
