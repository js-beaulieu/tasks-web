import { HttpResponse, http } from 'msw'
import type { ApiProjectMember, ApiTask } from '@/api/types'
import {
  addTaskTag,
  captureRequest,
  completeTask,
  createProject,
  createTask,
  deleteProject,
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
  removeTaskTag,
  searchUsers,
  setTaskTags,
  updateProject,
  updateTask,
} from './state'

function problem(status: number, title: string, detail?: string): Response {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title,
      status,
      detail,
    },
    {
      status,
      headers: { 'content-type': 'application/problem+json' },
    },
  )
}

function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}

function ok(body: unknown, status = 200): Response {
  return HttpResponse.json(body as object | null, { status })
}

export const handlers = [
  http.get('*/:base/users/me', async ({ request }) => {
    await captureRequest(request)
    const me = getMockData().me
    return me ? ok(me) : problem(401, 'Unauthorized', 'No active session')
  }),

  http.patch('*/:base/users/me', async ({ request }) => {
    await captureRequest(request)
    const me = getMockData().me
    if (!me) {
      return problem(401, 'Unauthorized', 'No active session')
    }
    const patch = (await request.json()) as Partial<typeof me>
    return ok({ ...me, ...patch })
  }),

  http.get('*/:base/users', async ({ request }) => {
    await captureRequest(request)
    const url = new URL(request.url)
    const ids = url.searchParams.getAll('ids')
    const search = url.searchParams.get('search')
    const limit = Number(url.searchParams.get('limit') ?? '20')

    if (search) {
      return ok(searchUsers(search, limit))
    }

    if (ids.length > 0) {
      return ok(listUsersByIDs(ids))
    }

    return ok(getMockData().users)
  }),

  http.get('*/:base/users/:userID', async ({ request, params }) => {
    await captureRequest(request)
    const user = getUser(String(params.userID))
    return user ? ok(user) : problem(404, 'Not Found')
  }),

  http.get('*/:base/projects', async ({ request }) => {
    await captureRequest(request)
    return ok(getMockData().projects)
  }),

  http.post('*/:base/projects', async ({ request }) => {
    await captureRequest(request)
    const body = (await request.json()) as {
      name: string
      description?: string
      due_date?: string
      assignee_id?: string
      statuses?: string[]
    }
    const project = createProject(body)
    return ok(project)
  }),

  http.get('*/:base/projects/:projectID', async ({ request, params }) => {
    await captureRequest(request)
    const project = getProject(String(params.projectID))
    return project ? ok(project) : problem(404, 'Not Found')
  }),

  http.patch('*/:base/projects/:projectID', async ({ request, params }) => {
    await captureRequest(request)
    const patch = (await request.json()) as Partial<ReturnType<typeof getProject>>
    const project = updateProject(String(params.projectID), patch as Record<string, unknown>)
    return project ? ok(project) : problem(404, 'Not Found')
  }),

  http.delete('*/:base/projects/:projectID', async ({ request, params }) => {
    await captureRequest(request)
    return deleteProject(String(params.projectID)) ? noContent() : problem(404, 'Not Found')
  }),

  http.get('*/:base/projects/:projectID/members', async ({ request, params }) => {
    await captureRequest(request)
    return ok(listProjectMembers(String(params.projectID)))
  }),

  http.post('*/:base/projects/:projectID/members', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as ApiProjectMember
    return ok({ ...body, project_id: String(params.projectID) })
  }),

  http.patch('*/:base/projects/:projectID/members/:userID', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as Pick<ApiProjectMember, 'role'>
    return ok({
      project_id: String(params.projectID),
      user_id: String(params.userID),
      role: body.role,
    })
  }),

  http.delete('*/:base/projects/:projectID/members/:userID', async ({ request }) => {
    await captureRequest(request)
    return ok({ reassigned: 0 })
  }),

  http.get('*/:base/projects/:projectID/statuses', async ({ request, params }) => {
    await captureRequest(request)
    return ok(listProjectStatuses(String(params.projectID)))
  }),

  http.post('*/:base/projects/:projectID/statuses', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as { status: string }
    const statuses = listProjectStatuses(String(params.projectID))
    const created = {
      project_id: String(params.projectID),
      status: body.status,
      position: statuses.length,
    }
    return ok(created)
  }),

  http.delete('*/:base/projects/:projectID/statuses/:status', async ({ request }) => {
    await captureRequest(request)
    return noContent()
  }),

  http.get('*/:base/projects/:projectID/tasks', async ({ request, params }) => {
    await captureRequest(request)
    const url = new URL(request.url)
    return ok(
      listTasksByProject(String(params.projectID), {
        status: url.searchParams.get('status') ?? undefined,
        assigneeID: url.searchParams.get('assignee_id') ?? undefined,
        tag: url.searchParams.get('tag') ?? undefined,
      }),
    )
  }),

  http.post('*/:base/projects/:projectID/tasks', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as Partial<ApiTask> & Pick<ApiTask, 'name'>
    return ok(createTask(String(params.projectID), body))
  }),

  http.get('*/:base/tags', async ({ request }) => {
    await captureRequest(request)
    return ok(listGlobalTags())
  }),

  http.get('*/:base/tasks/:taskID', async ({ request, params }) => {
    await captureRequest(request)
    const task = getTask(String(params.taskID))
    return task ? ok(task) : problem(404, 'Not Found')
  }),

  http.patch('*/:base/tasks/:taskID', async ({ request, params }) => {
    await captureRequest(request)
    const patch = (await request.json()) as Partial<ApiTask>
    const task = updateTask(String(params.taskID), patch)
    return task ? ok(task) : problem(404, 'Not Found')
  }),

  http.delete('*/:base/tasks/:taskID', async ({ request, params }) => {
    await captureRequest(request)
    return deleteTask(String(params.taskID)) ? noContent() : problem(404, 'Not Found')
  }),

  http.post('*/:base/tasks/:taskID/complete', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as { done_status: string }
    const result = completeTask(String(params.taskID), body.done_status)
    return result ? ok(result) : problem(404, 'Not Found')
  }),

  http.get('*/:base/tasks/:taskID/tags', async ({ request, params }) => {
    await captureRequest(request)
    return ok(getTaskTags(String(params.taskID)))
  }),

  http.post('*/:base/tasks/:taskID/tags', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as { tag: string }
    addTaskTag(String(params.taskID), body.tag)
    return ok({})
  }),

  http.delete('*/:base/tasks/:taskID/tags/:tag', async ({ request, params }) => {
    await captureRequest(request)
    removeTaskTag(String(params.taskID), String(params.tag))
    return noContent()
  }),

  http.get('*/:base/tasks/:taskID/tasks', async ({ request, params }) => {
    await captureRequest(request)
    return ok(listSubtasks(String(params.taskID)))
  }),

  http.post('*/:base/tasks/:taskID/tasks', async ({ request, params }) => {
    await captureRequest(request)
    const body = (await request.json()) as Partial<ApiTask> & Pick<ApiTask, 'name'>
    return ok(
      createTask(String(getTask(String(params.taskID))?.project_id ?? 'p1'), {
        ...body,
        parent_id: String(params.taskID),
      }),
    )
  }),

]

export function primeTaskTags(taskID: string, tags: string[]): void {
  setTaskTags(taskID, tags)
}
