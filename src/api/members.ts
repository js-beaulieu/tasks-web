import { apiClient, apiList } from './client'

export type MemberRole = 'read' | 'modify' | 'admin'

export interface ProjectMember {
  projectId: string
  userId: string
  role: MemberRole
}

interface ApiProjectMember {
  project_id: string
  user_id: string
  role: string
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
  const member = await apiClient<ApiProjectMember>(
    `projects/${encodeURIComponent(projectID)}/members`,
    {
      method: 'POST',
      body: { user_id: input.userId, role: input.role },
    },
  )
  return fromApiProjectMember(member)
}

export async function updateProjectMember(
  projectID: string,
  userID: string,
  role: MemberRole,
): Promise<ProjectMember> {
  const member = await apiClient<ApiProjectMember>(
    `projects/${encodeURIComponent(projectID)}/members/${encodeURIComponent(userID)}`,
    {
      method: 'PATCH',
      body: { role },
    },
  )
  return fromApiProjectMember(member)
}

export async function removeProjectMember(
  projectID: string,
  userID: string,
): Promise<{ reassigned: number }> {
  return apiClient<{ reassigned: number }>(
    `projects/${encodeURIComponent(projectID)}/members/${encodeURIComponent(userID)}`,
    { method: 'DELETE' },
  )
}