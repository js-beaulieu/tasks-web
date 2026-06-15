import { apiClient, apiList } from './client'

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
  description?: string
  status?: string
  dueDate?: string
  assigneeId?: string
  position?: number
  parentId?: string | null
  projectId?: string
  recurrence?: string | null
}

export interface CompleteTaskResponse {
  completed: Task
  next: Task | null
}

interface ApiTask {
  id: string
  project_id: string
  parent_id: string | null
  name: string
  description: string | null
  status: string
  due_date: string | null
  owner_id: string
  assignee_id: string | null
  position: number
  recurrence: string | null
  created_at: string
  updated_at: string
}

interface ApiCreateTaskBody {
  name: string
  description?: string
  status?: string
  due_date?: string
  assignee_id?: string
  recurrence?: string
}

interface ApiUpdateTaskBody {
  name?: string
  description?: string
  status?: string
  due_date?: string
  assignee_id?: string
  position?: number
  parent_id?: string | null
  project_id?: string
  recurrence?: string | null
}

interface ApiCompleteTaskBody {
  done_status: string
}

interface ApiCompleteTaskResponse {
  completed: ApiTask
  next: ApiTask | null
}

function fromApiTask(t: ApiTask): Task {
  return {
    id: t.id,
    projectId: t.project_id,
    parentId: t.parent_id,
    name: t.name,
    description: t.description,
    status: t.status,
    dueDate: t.due_date,
    ownerId: t.owner_id,
    assigneeId: t.assignee_id,
    position: t.position,
    recurrence: t.recurrence,
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
  if (input.description !== undefined) body.description = input.description
  if (input.status !== undefined) body.status = input.status
  if (input.dueDate !== undefined) body.due_date = input.dueDate
  if (input.assigneeId !== undefined) body.assignee_id = input.assigneeId
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

export async function updateTask(taskID: string, input: UpdateTaskInput): Promise<Task> {
  const task = await apiClient<ApiTask>(`tasks/${encodeURIComponent(taskID)}`, {
    method: 'PATCH',
    body: toApiUpdateBody(input),
  })
  return fromApiTask(task)
}

export async function deleteTask(taskID: string): Promise<void> {
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}`, { method: 'DELETE' })
}

export async function completeTask(
  taskID: string,
  doneStatus: string,
): Promise<CompleteTaskResponse> {
  const resp = await apiClient<ApiCompleteTaskResponse>(
    `tasks/${encodeURIComponent(taskID)}/complete`,
    {
      method: 'POST',
      body: { done_status: doneStatus } as ApiCompleteTaskBody,
    },
  )
  return {
    completed: fromApiTask(resp.completed),
    next: resp.next ? fromApiTask(resp.next) : null,
  }
}

export async function listSubtasks(taskID: string): Promise<Task[]> {
  const tasks = await apiList<ApiTask>(`tasks/${encodeURIComponent(taskID)}/tasks`)
  return tasks.map(fromApiTask)
}

export async function createSubtask(
  parentTaskID: string,
  input: CreateTaskInput,
): Promise<Task> {
  const task = await apiClient<ApiTask>(`tasks/${encodeURIComponent(parentTaskID)}/tasks`, {
    method: 'POST',
    body: toApiCreateBody(input),
  })
  return fromApiTask(task)
}

export async function listTaskTags(taskID: string): Promise<string[]> {
  return apiList<string>(`tasks/${encodeURIComponent(taskID)}/tags`)
}

export async function addTaskTag(taskID: string, tag: string): Promise<void> {
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}/tags`, {
    method: 'POST',
    body: { tag },
  })
}

export async function removeTaskTag(taskID: string, tag: string): Promise<void> {
  await apiClient<void>(`tasks/${encodeURIComponent(taskID)}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  })
}