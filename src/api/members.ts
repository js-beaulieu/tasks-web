import { apiClient, apiList } from './client'
import type {
  ApiProjectMember,
  ApiAddMemberBody,
  ApiUpdateMemberBody,
  ApiRemoveMemberOutput,
} from './types'

export type MemberRole = 'read' | 'modify' | 'admin'

export interface ProjectMember {
  projectId: string
  userId: string
  role: MemberRole
}

function fromApiProjectMember(m: ApiProjectMember): ProjectMember {
  return {
    projectId: m.project_id,
    userId: m.user_id,
    role: m.role as MemberRole,
  }
}

export async function listProjectMembers(projectID: string): Promise<ProjectMember[]> {
  const members = await apiList<ApiProjectMember>(
    `projects/${encodeURIComponent(projectID)}/members`,
  )
  return members.map(fromApiProjectMember)
}

export interface AddMemberInput {
  userId: string
  role: MemberRole
}

export async function addProjectMember(
  projectID: string,
  input: AddMemberInput,
): Promise<ProjectMember> {
  const body: ApiAddMemberBody = { user_id: input.userId, role: input.role }
  const { data: member } = await apiClient<ApiProjectMember>(
    `projects/${encodeURIComponent(projectID)}/members`,
    {
      method: 'POST',
      body,
    },
  )
  return fromApiProjectMember(member)
}

export async function updateProjectMember(
  projectID: string,
  userID: string,
  role: MemberRole,
): Promise<ProjectMember> {
  const body: ApiUpdateMemberBody = { role }
  const { data: member } = await apiClient<ApiProjectMember>(
    `projects/${encodeURIComponent(projectID)}/members/${encodeURIComponent(userID)}`,
    {
      method: 'PATCH',
      body,
    },
  )
  return fromApiProjectMember(member)
}

export async function removeProjectMember(
  projectID: string,
  userID: string,
): Promise<{ reassigned: number }> {
  const { data } = await apiClient<ApiRemoveMemberOutput>(
    `projects/${encodeURIComponent(projectID)}/members/${encodeURIComponent(userID)}`,
    { method: 'DELETE' },
  )
  return data
}
