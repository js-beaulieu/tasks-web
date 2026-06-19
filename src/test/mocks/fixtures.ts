import type {
  ApiProject,
  ApiProjectMember,
  ApiProjectStatus,
  ApiTask,
  ApiUser,
} from '@/api/types'

const DEFAULT_CREATED_AT = '2026-01-01T00:00:00Z'
const DEFAULT_UPDATED_AT = '2026-01-02T00:00:00Z'

export function makeApiUser(partial: Partial<ApiUser> = {}): ApiUser {
  return {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@example.com',
    created_at: DEFAULT_CREATED_AT,
    ...partial,
  }
}

export function makeApiProject(partial: Partial<ApiProject> = {}): ApiProject {
  return {
    id: 'p1',
    name: 'Task Project',
    owner_id: 'dev-user',
    created_at: DEFAULT_CREATED_AT,
    updated_at: DEFAULT_UPDATED_AT,
    ...partial,
  }
}

export function makeApiProjectMember(
  partial: Partial<ApiProjectMember> = {},
): ApiProjectMember {
  return {
    project_id: 'p1',
    user_id: 'dev-user',
    role: 'admin',
    ...partial,
  }
}

export function makeApiProjectStatus(
  partial: Partial<ApiProjectStatus> = {},
): ApiProjectStatus {
  return {
    project_id: 'p1',
    status: 'todo',
    position: 0,
    ...partial,
  }
}

export function makeApiTask(partial: Partial<ApiTask> = {}): ApiTask {
  return {
    id: 't1',
    project_id: 'p1',
    name: 'Test task',
    status: 'todo',
    owner_id: 'dev-user',
    position: 0,
    created_at: DEFAULT_CREATED_AT,
    updated_at: DEFAULT_UPDATED_AT,
    ...partial,
  }
}
