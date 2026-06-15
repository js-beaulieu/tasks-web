import { apiList } from './client'

export interface ProjectStatus {
  projectId: string
  status: string
  position: number
}

interface ApiProjectStatus {
  project_id: string
  status: string
  position: number
}

function fromApiProjectStatus(s: ApiProjectStatus): ProjectStatus {
  return {
    projectId: s.project_id,
    status: s.status,
    position: s.position,
  }
}

export async function listProjectStatuses(projectID: string): Promise<ProjectStatus[]> {
  const statuses = await apiList<ApiProjectStatus>(
    `projects/${encodeURIComponent(projectID)}/statuses`,
  )
  return statuses.map(fromApiProjectStatus)
}