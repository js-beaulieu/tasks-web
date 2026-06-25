import type { ApiProjectMember, ApiTask } from '@/api/types'
import {
  addProjectMember,
  addProjectStatus,
  addTaskTag,
  createProject,
  createTask,
  deleteProject,
  deleteProjectStatus,
  deleteTask,
  getMockData,
  getProject,
  getTask,
  getTaskTags,
  getUser,
  listGlobalTags,
  listProjectMembers,
  listProjectStatuses,
  listSubtasks,
  listTasksByProject,
  listUsersByIDs,
  removeProjectMember,
  removeTaskTag,
  searchUsers,
  updateProject,
  updateProjectMember,
  updateTask,
} from './state'

export interface MockRouteRequest {
  method: string
  url: URL
  pathname: string
  jsonBody: unknown
}

export type MockResponseSpec =
  | { kind: 'json'; body: unknown; status?: number; headers?: Record<string, string> }
  | { kind: 'problem'; status: number; title: string; detail?: string }
  | { kind: 'no-content' }

export function isMockApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/tasks/')
}

export function normalizeApiPath(pathname: string): string {
  if (pathname.startsWith('/api/')) {
    return pathname.slice('/api'.length)
  }
  if (pathname.startsWith('/tasks/')) {
    return pathname.slice('/tasks'.length)
  }
  return pathname
}

function json(body: unknown, status = 200, headers?: Record<string, string>): MockResponseSpec {
  return { kind: 'json', body, status, headers }
}

function problem(status: number, title: string, detail?: string): MockResponseSpec {
  return { kind: 'problem', status, title, detail }
}

function noContent(): MockResponseSpec {
  return { kind: 'no-content' }
}

export function handleMockApiRequest(request: MockRouteRequest): MockResponseSpec {
  const { method, pathname, url, jsonBody } = request

  if (pathname === '/users/me' && method === 'GET') {
    const me = getMockData().me
    return me ? json(me) : problem(401, 'Unauthorized', 'No active session')
  }

  if (pathname === '/users/me' && method === 'PATCH') {
    const me = getMockData().me
    if (!me) return problem(401, 'Unauthorized', 'No active session')
    return json({ ...me, ...(jsonBody as object) })
  }

  if (pathname === '/users' && method === 'GET') {
    const ids = url.searchParams.getAll('ids')
    const search = url.searchParams.get('search')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    if (search) return json(searchUsers(search, limit))
    if (ids.length > 0) return json(listUsersByIDs(ids))
    return json(getMockData().users)
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/)
  if (userMatch && method === 'GET') {
    const user = getUser(decodeURIComponent(userMatch[1]!))
    return user ? json(user) : problem(404, 'Not Found')
  }

  if (pathname === '/projects' && method === 'GET') {
    return json(getMockData().projects)
  }

  if (pathname === '/projects' && method === 'POST') {
    const body = jsonBody as {
      name: string
      description?: string
      due_date?: string
      assignee_id?: string
      statuses?: string[]
    }
    return json(createProject(body))
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/)
  if (projectMatch) {
    const projectID = decodeURIComponent(projectMatch[1]!)
    if (method === 'GET') {
      const project = getProject(projectID)
      return project ? json(project) : problem(404, 'Not Found')
    }
    if (method === 'PATCH') {
      const project = updateProject(projectID, (jsonBody ?? {}) as Record<string, unknown>)
      return project ? json(project) : problem(404, 'Not Found')
    }
    if (method === 'DELETE') {
      return deleteProject(projectID) ? noContent() : problem(404, 'Not Found')
    }
  }

  const membersMatch = pathname.match(/^\/projects\/([^/]+)\/members$/)
  if (membersMatch) {
    const projectID = decodeURIComponent(membersMatch[1]!)
    if (method === 'GET') return json(listProjectMembers(projectID))
    if (method === 'POST') {
      const body = jsonBody as { user_id: string; role: ApiProjectMember['role'] }
      return json(addProjectMember(projectID, body.user_id, body.role))
    }
  }

  const memberMatch = pathname.match(/^\/projects\/([^/]+)\/members\/([^/]+)$/)
  if (memberMatch) {
    const projectID = decodeURIComponent(memberMatch[1]!)
    const userID = decodeURIComponent(memberMatch[2]!)
    if (method === 'PATCH') {
      const body = jsonBody as Pick<ApiProjectMember, 'role'>
      const member = updateProjectMember(projectID, userID, body.role)
      return member ? json(member) : problem(404, 'Not Found')
    }
    if (method === 'DELETE') {
      const result = removeProjectMember(projectID, userID)
      return result ? json(result) : problem(404, 'Not Found')
    }
  }

  const statusesMatch = pathname.match(/^\/projects\/([^/]+)\/statuses$/)
  if (statusesMatch) {
    const projectID = decodeURIComponent(statusesMatch[1]!)
    if (method === 'GET') return json(listProjectStatuses(projectID))
    if (method === 'POST') {
      const body = jsonBody as { status: string }
      const result = addProjectStatus(projectID, body.status)
      if (result.conflict) return problem(409, 'Conflict', 'status already exists')
      return json(result.created, 201)
    }
  }

  if (pathname.match(/^\/projects\/[^/]+\/statuses\/[^/]+$/) && method === 'DELETE') {
    const statusMatch = pathname.match(/^\/projects\/([^/]+)\/statuses\/([^/]+)$/)
    const projectID = decodeURIComponent(statusMatch![1]!)
    const status = decodeURIComponent(statusMatch![2]!)
    const result = deleteProjectStatus(projectID, status)
    if (result.notFound) return problem(404, 'Not Found')
    if (result.conflict) return problem(409, 'Conflict', 'status is in use by tasks')
    return noContent()
  }

  const projectTasksMatch = pathname.match(/^\/projects\/([^/]+)\/tasks$/)
  if (projectTasksMatch) {
    const projectID = decodeURIComponent(projectTasksMatch[1]!)
    if (method === 'GET') {
      return json(
        listTasksByProject(projectID, {
          status: url.searchParams.get('status') ?? undefined,
          assigneeID: url.searchParams.get('assignee_id') ?? undefined,
          tag: url.searchParams.get('tag') ?? undefined,
        }),
      )
    }
    if (method === 'POST') {
      return json(createTask(projectID, jsonBody as Partial<ApiTask> & Pick<ApiTask, 'name'>))
    }
  }

  if (pathname === '/tags' && method === 'GET') {
    return json(listGlobalTags())
  }

  const taskMatch = pathname.match(/^\/tasks\/([^/]+)$/)
  if (taskMatch) {
    const taskID = decodeURIComponent(taskMatch[1]!)
    if (method === 'GET') {
      const task = getTask(taskID)
      return task ? json(task) : problem(404, 'Not Found')
    }
    if (method === 'PATCH') {
      const result = updateTask(taskID, (jsonBody ?? {}) as Partial<ApiTask>)
      if (!result) return problem(404, 'Not Found')
      const headers: Record<string, string> = {}
      if (result.nextOccurrenceId) {
        headers['X-Next-Occurrence-Id'] = result.nextOccurrenceId
      }
      return json(result.task, 200, headers)
    }
    if (method === 'DELETE') {
      return deleteTask(taskID) ? noContent() : problem(404, 'Not Found')
    }
  }

  const taskTagsMatch = pathname.match(/^\/tasks\/([^/]+)\/tags$/)
  if (taskTagsMatch) {
    const taskID = decodeURIComponent(taskTagsMatch[1]!)
    if (method === 'GET') return json(getTaskTags(taskID))
    if (method === 'POST') {
      const body = jsonBody as { tag: string }
      addTaskTag(taskID, body.tag)
      return json({})
    }
  }

  const taskTagMatch = pathname.match(/^\/tasks\/([^/]+)\/tags\/([^/]+)$/)
  if (taskTagMatch && method === 'DELETE') {
    removeTaskTag(decodeURIComponent(taskTagMatch[1]!), decodeURIComponent(taskTagMatch[2]!))
    return noContent()
  }

  const subtasksMatch = pathname.match(/^\/tasks\/([^/]+)\/tasks$/)
  if (subtasksMatch) {
    const parentID = decodeURIComponent(subtasksMatch[1]!)
    if (method === 'GET') return json(listSubtasks(parentID))
    if (method === 'POST') {
      const parentTask = getTask(parentID)
      return json(
        createTask(parentTask?.project_id ?? 'p1', {
          ...(jsonBody as Partial<ApiTask> & Pick<ApiTask, 'name'>),
          parent_id: parentID,
        }),
      )
    }
  }

  return problem(404, 'Not Found')
}
