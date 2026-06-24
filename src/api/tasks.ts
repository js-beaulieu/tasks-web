import { apiClient, apiClientWithHeaders, apiList } from './client'
import type {
  ApiTask,
  ApiCreateTaskBody,
  ApiCreateSubtaskBody,
  ApiUpdateTaskBody,
  ApiAddTagBody,
} from './types'

export interface Task {
  id: string
  projectId: string
  parentId: string | null
  name: string
  description: string | null
  status: string
  dueDate: string | null
  ownerId: string
  assigneeId: string | null
  position: number
  recurrence: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  name: string
  description?: string
  status?: string
  dueDate?: string
  assigneeId?: string
  recurrence?: string
}

export interface UpdateTaskInput {
  name?: string
  description?: string | null
  status?: string
  dueDate?: string | null
  assigneeId?: string | null
  position?: number
  parentId?: string | null
  projectId?: string
  recurrence?: string | null
}

export interface UpdateTaskResult {
  task: Task
  nextOccurrenceId: string | null
}

function fromApiTask(t: ApiTask): Task {
  // The API omits nullable fields when nil (Go `*string` + omitempty), so the
  // generated types mark them optional. Normalize undefined → null to keep the
  // app-level Task shape as `string | null`.
  return {
    id: t.id,
    projectId: t.project_id,
    parentId: t.parent_id ?? null,
    name: t.name,
    description: t.description ?? null,
    status: t.status,
    dueDate: t.due_date ?? null,
    ownerId: t.owner_id,
    assigneeId: t.assignee_id ?? null,
    position: t.position,
    recurrence: t.recurrence ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}

function toApiCreateBody(input: CreateTaskInput): ApiCreateTaskBody {
  const body: ApiCreateTaskBody = { name: input.name }
  if (input.description?.trim()) body.description = input.description.trim()
  if (input.status) body.status = input.status
  if (input.dueDate) body.due_date = input.dueDate
  if (input.assigneeId) body.assignee_id = input.assigneeId
  if (input.recurrence) body.recurrence = input.recurrence
  return body
}

function toApiUpdateBody(input: UpdateTaskInput): ApiUpdateTaskBody {
  const body: ApiUpdateTaskBody = {}
  if (input.name !== undefined) body.name = input.name
  if (input.description !== undefined) body.description = input.description ?? undefined
  if (input.status !== undefined) body.status = input.status
  if (input.dueDate !== undefined) body.due_date = input.dueDate ?? undefined
  if (input.assigneeId !== undefined) body.assignee_id = input.assigneeId ?? undefined
  if (input.position !== undefined) body.position = input.position
  if (input.parentId !== undefined) body.parent_id = input.parentId
  if (input.projectId !== undefined) body.project_id = input.projectId
  if (input.recurrence !== undefined) body.recurrence = input.recurrence
  return body
}

export async function listProjectTasks(
  projectID: string,
  filters?: { status?: string; assigneeId?: string; tag?: string },
): Promise<Task[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.assigneeId) params.set('assignee_id', filters.assigneeId)
  if (filters?.tag) params.set('tag', filters.tag)
  const query = params.toString()
  const path = `projects/${encodeURIComponent(projectID)}/tasks${query ? `?${query}` : ''}`
  const tasks = await apiList<ApiTask>(path)
  return tasks.map(fromApiTask)
}

export async function getTask(taskID: string): Promise<Task> {
  const task = await apiClient<ApiTask>(`tasks/${encodeURIComponent(taskID)}`)
  return fromApiTask(task)
}

export async function createTask(projectID: string, input: CreateTaskInput): Promise<Task> {
  const task = await apiClient<ApiTask>(`projects/${encodeURIComponent(projectID)}/tasks`, {
    method: 'POST',
    body: toApiCreateBody(input),
  })
  return fromApiTask(task)
}

export async function updateTask(taskID: string, input: UpdateTaskInput): Promise<UpdateTaskResult> {
  const { data, headers } = await apiClientWithHeaders<ApiTask>(`tasks/${encodeURIComponent(taskID)}`, {
    method: 'PATCH',
    body: toApiUpdateBody(input),
  })
  const nextId = headers.get('X-Next-Occurrence-Id') || null
  return {
    task: fromApiTask(data),
    nextOccurrenceId: nextId,
  }
}

export async function deleteTask(taskID: string): Promise<void> {
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}`, { method: 'DELETE' })
}

export async function listSubtasks(taskID: string): Promise<Task[]> {
  const tasks = await apiList<ApiTask>(`tasks/${encodeURIComponent(taskID)}/tasks`)
  return tasks.map(fromApiTask)
}

export async function createSubtask(
  parentTaskID: string,
  input: CreateTaskInput,
): Promise<Task> {
  const body = toApiCreateBody(input) as ApiCreateSubtaskBody
  const task = await apiClient<ApiTask>(`tasks/${encodeURIComponent(parentTaskID)}/tasks`, {
    method: 'POST',
    body,
  })
  return fromApiTask(task)
}

export async function listTaskTags(taskID: string): Promise<string[]> {
  return apiList<string>(`tasks/${encodeURIComponent(taskID)}/tags`)
}

export async function addTaskTag(taskID: string, tag: string): Promise<void> {
  const body: ApiAddTagBody = { tag }
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}/tags`, {
    method: 'POST',
    body,
  })
}

export async function removeTaskTag(taskID: string, tag: string): Promise<void> {
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  })
}
