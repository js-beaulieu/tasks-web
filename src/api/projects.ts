import { apiClient, apiList } from './client'
import type { ApiProject, ApiCreateProjectBody, ApiUpdateProjectBody } from './types'

export interface Project {
  id: string
  name: string
  description?: string
  dueDate?: string
  ownerId: string
  assigneeId?: string
  effectiveRole?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string
}

export type UpdateProjectInput = CreateProjectInput

function fromApiProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    dueDate: project.due_date,
    ownerId: project.owner_id,
    assigneeId: project.assignee_id,
    effectiveRole: project.effective_role,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

function toApiCreateBody(input: CreateProjectInput): ApiCreateProjectBody {
  const body: ApiCreateProjectBody = { name: input.name }
  const description = input.description?.trim()
  if (description) {
    body.description = description
  }
  return body
}

function toApiUpdateBody(input: UpdateProjectInput): ApiUpdateProjectBody {
  return toApiCreateBody(input)
}

export async function listProjects(): Promise<Project[]> {
  const projects = await apiList<ApiProject>('projects')
  return projects.map(fromApiProject)
}

export async function getProject(projectID: string): Promise<Project> {
  const project = await apiClient<ApiProject>(`projects/${encodeURIComponent(projectID)}`)
  return fromApiProject(project)
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const project = await apiClient<ApiProject>('projects', {
    method: 'POST',
    body: toApiCreateBody(input),
  })
  return fromApiProject(project)
}

export async function updateProject(
  projectID: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const project = await apiClient<ApiProject>(`projects/${encodeURIComponent(projectID)}`, {
    method: 'PATCH',
    body: toApiUpdateBody(input),
  })
  return fromApiProject(project)
}

export async function deleteProject(projectID: string): Promise<void> {
  await apiClient<void>(`projects/${encodeURIComponent(projectID)}`, { method: 'DELETE' })
}
