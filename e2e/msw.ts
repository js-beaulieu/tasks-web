import { test as base, expect } from '@playwright/test'
import type { ApiProjectMember, ApiTask } from '../src/api/types'
import {
  addProjectMember,
  addProjectStatus,
  addTaskTag,
  captureRequest,
  createProject,
  createTask,
  deleteProject,
  deleteProjectStatus,
  deleteTask,
  getLastRequest,
  getMockData,
  getProject,
  getRequestLog,
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
  resetMockData,
  searchUsers,
  setUpdateNextTask,
  updateProjectMember,
  updateTask,
  type MockData,
  type MockRequestLogEntry,
  type MockSeed,
} from '../src/test/mocks/state'

export interface MockApi {
  prepare(seed?: MockSeed): Promise<void>
  reset(seed?: MockSeed): Promise<void>
  getState(): Promise<MockData>
  getLastRequest(): Promise<MockRequestLogEntry | undefined>
  getRequestLog(): Promise<MockRequestLogEntry[]>
  setUpdateNextTask(taskID: string, nextTask: ApiTask | null): Promise<void>
}

function isMockApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/tasks/')
}

function normalizeApiPath(pathname: string): string {
  if (pathname.startsWith('/api/')) {
    return pathname.slice('/api'.length)
  }
  if (pathname.startsWith('/tasks/')) {
    return pathname.slice('/tasks'.length)
  }
  return pathname
}

async function logPlaywrightRequest(route: import('@playwright/test').Route): Promise<void> {
  const request = route.request()
  const method = request.method()
  const headers = request.headers()
  const body = method === 'GET' || method === 'HEAD' ? undefined : request.postData() ?? undefined
  await captureRequest(
    new Request(request.url(), {
      method,
      headers,
      body,
    }),
  )
}

function jsonBody(route: import('@playwright/test').Route): unknown {
  const request = route.request()
  const contentType = request.headers()['content-type'] ?? ''
  if (!contentType.includes('application/json')) {
    return undefined
  }
  return request.postDataJSON()
}

async function fulfillJson(route: import('@playwright/test').Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function fulfillProblem(
  route: import('@playwright/test').Route,
  status: number,
  title: string,
  detail?: string,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/problem+json',
    body: JSON.stringify({ type: 'about:blank', title, status, detail }),
  })
}

async function fulfillNoContent(route: import('@playwright/test').Route): Promise<void> {
  await route.fulfill({ status: 204, body: '' })
}

async function handleApiRoute(route: import('@playwright/test').Route): Promise<void> {
  const request = route.request()
  const url = new URL(request.url())
  const pathname = normalizeApiPath(url.pathname)
  const method = request.method()

  await logPlaywrightRequest(route)

  if (pathname === '/users/me' && method === 'GET') {
    const me = getMockData().me
    if (!me) return fulfillProblem(route, 401, 'Unauthorized', 'No active session')
    return fulfillJson(route, me)
  }

  if (pathname === '/users/me' && method === 'PATCH') {
    const me = getMockData().me
    if (!me) return fulfillProblem(route, 401, 'Unauthorized', 'No active session')
    return fulfillJson(route, { ...me, ...(jsonBody(route) as object) })
  }

  if (pathname === '/users' && method === 'GET') {
    const ids = url.searchParams.getAll('ids')
    const search = url.searchParams.get('search')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    if (search) return fulfillJson(route, searchUsers(search, limit))
    if (ids.length > 0) return fulfillJson(route, listUsersByIDs(ids))
    return fulfillJson(route, getMockData().users)
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/)
  if (userMatch && method === 'GET') {
    const user = getUser(decodeURIComponent(userMatch[1]!))
    return user ? fulfillJson(route, user) : fulfillProblem(route, 404, 'Not Found')
  }

  if (pathname === '/projects' && method === 'GET') {
    return fulfillJson(route, getMockData().projects)
  }

  if (pathname === '/projects' && method === 'POST') {
    const body = jsonBody(route) as {
      name: string
      description?: string
      due_date?: string
      assignee_id?: string
    }
    return fulfillJson(route, createProject(body))
  }

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/)
  if (projectMatch) {
    const projectID = decodeURIComponent(projectMatch[1]!)
    if (method === 'GET') {
      const project = getProject(projectID)
      return project ? fulfillJson(route, project) : fulfillProblem(route, 404, 'Not Found')
    }
    if (method === 'PATCH') {
      const project = updateProject(projectID, (jsonBody(route) ?? {}) as Record<string, unknown>)
      return project ? fulfillJson(route, project) : fulfillProblem(route, 404, 'Not Found')
    }
    if (method === 'DELETE') {
      return deleteProject(projectID) ? fulfillNoContent(route) : fulfillProblem(route, 404, 'Not Found')
    }
  }

  const membersMatch = pathname.match(/^\/projects\/([^/]+)\/members$/)
  if (membersMatch) {
    const projectID = decodeURIComponent(membersMatch[1]!)
    if (method === 'GET') return fulfillJson(route, listProjectMembers(projectID))
    if (method === 'POST') {
      const body = jsonBody(route) as { user_id: string; role: ApiProjectMember['role'] }
      return fulfillJson(route, addProjectMember(projectID, body.user_id, body.role))
    }
  }

  const memberMatch = pathname.match(/^\/projects\/([^/]+)\/members\/([^/]+)$/)
  if (memberMatch) {
    const projectID = decodeURIComponent(memberMatch[1]!)
    const userID = decodeURIComponent(memberMatch[2]!)
    if (method === 'PATCH') {
      const body = jsonBody(route) as Pick<ApiProjectMember, 'role'>
      const member = updateProjectMember(projectID, userID, body.role)
      return member ? fulfillJson(route, member) : fulfillProblem(route, 404, 'Not Found')
    }
    if (method === 'DELETE') {
      const result = removeProjectMember(projectID, userID)
      return result ? fulfillJson(route, result) : fulfillProblem(route, 404, 'Not Found')
    }
  }

  const statusesMatch = pathname.match(/^\/projects\/([^/]+)\/statuses$/)
  if (statusesMatch) {
    const projectID = decodeURIComponent(statusesMatch[1]!)
    if (method === 'GET') return fulfillJson(route, listProjectStatuses(projectID))
    if (method === 'POST') {
      const body = jsonBody(route) as { status: string }
      const result = addProjectStatus(projectID, body.status)
      if (result.conflict) return fulfillProblem(route, 409, 'Conflict', 'status already exists')
      return fulfillJson(route, result.created, 201)
    }
  }

  if (pathname.match(/^\/projects\/[^/]+\/statuses\/[^/]+$/) && method === 'DELETE') {
    const statusMatch = pathname.match(/^\/projects\/([^/]+)\/statuses\/([^/]+)$/)
    const projectID = decodeURIComponent(statusMatch![1]!)
    const status = decodeURIComponent(statusMatch![2]!)
    const result = deleteProjectStatus(projectID, status)
    if (result.notFound) return fulfillProblem(route, 404, 'Not Found')
    if (result.conflict) return fulfillProblem(route, 409, 'Conflict', 'status is in use by tasks')
    return fulfillNoContent(route)
  }

  const projectTasksMatch = pathname.match(/^\/projects\/([^/]+)\/tasks$/)
  if (projectTasksMatch) {
    const projectID = decodeURIComponent(projectTasksMatch[1]!)
    if (method === 'GET') {
      return fulfillJson(
        route,
        listTasksByProject(projectID, {
          status: url.searchParams.get('status') ?? undefined,
          assigneeID: url.searchParams.get('assignee_id') ?? undefined,
          tag: url.searchParams.get('tag') ?? undefined,
        }),
      )
    }
    if (method === 'POST') {
      return fulfillJson(route, createTask(projectID, jsonBody(route) as Partial<ApiTask> & Pick<ApiTask, 'name'>))
    }
  }

  if (pathname === '/tags' && method === 'GET') {
    return fulfillJson(route, listGlobalTags())
  }

  const taskMatch = pathname.match(/^\/tasks\/([^/]+)$/)
  if (taskMatch) {
    const taskID = decodeURIComponent(taskMatch[1]!)
    if (method === 'GET') {
      const task = getTask(taskID)
      return task ? fulfillJson(route, task) : fulfillProblem(route, 404, 'Not Found')
    }
    if (method === 'PATCH') {
      const result = updateTask(taskID, (jsonBody(route) ?? {}) as Partial<ApiTask>)
      return result ? fulfillJson(route, result) : fulfillProblem(route, 404, 'Not Found')
    }
    if (method === 'DELETE') {
      return deleteTask(taskID) ? fulfillNoContent(route) : fulfillProblem(route, 404, 'Not Found')
    }
  }

  const taskTagsMatch = pathname.match(/^\/tasks\/([^/]+)\/tags$/)
  if (taskTagsMatch) {
    const taskID = decodeURIComponent(taskTagsMatch[1]!)
    if (method === 'GET') return fulfillJson(route, getTaskTags(taskID))
    if (method === 'POST') {
      const body = jsonBody(route) as { tag: string }
      addTaskTag(taskID, body.tag)
      return fulfillJson(route, {})
    }
  }

  const taskTagMatch = pathname.match(/^\/tasks\/([^/]+)\/tags\/([^/]+)$/)
  if (taskTagMatch && method === 'DELETE') {
    removeTaskTag(decodeURIComponent(taskTagMatch[1]!), decodeURIComponent(taskTagMatch[2]!))
    return fulfillNoContent(route)
  }

  const subtasksMatch = pathname.match(/^\/tasks\/([^/]+)\/tasks$/)
  if (subtasksMatch) {
    const parentID = decodeURIComponent(subtasksMatch[1]!)
    if (method === 'GET') return fulfillJson(route, listSubtasks(parentID))
    if (method === 'POST') {
      const parentTask = getTask(parentID)
      return fulfillJson(
        route,
        createTask(parentTask?.project_id ?? 'p1', {
          ...(jsonBody(route) as Partial<ApiTask> & Pick<ApiTask, 'name'>),
          parent_id: parentID,
        }),
      )
    }
  }

  return fulfillProblem(route, 404, 'Not Found')
}

export const test = base.extend<{ mockApi: MockApi }>({
  page: async ({ page }, use) => {
    resetMockData()
    await page.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (!isMockApiPath(pathname)) {
        await route.continue()
        return
      }
      await handleApiRoute(route)
    })
    await use(page)
  },

  mockApi: async ({ page: _page }, use) => {
    const api: MockApi = {
      async prepare(seed = {}) {
        resetMockData(seed)
      },

      async reset(seed = {}) {
        resetMockData(seed)
      },

      async getState() {
        return getMockData()
      },

      async getLastRequest() {
        return getLastRequest()
      },

      async getRequestLog() {
        return getRequestLog()
      },

      async setUpdateNextTask(taskID, nextTask) {
        setUpdateNextTask(taskID, nextTask)
      },
    }

    await use(api)
  },
})

export { expect }
