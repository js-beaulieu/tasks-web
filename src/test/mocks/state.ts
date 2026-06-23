import type {
  ApiProject,
  ApiProjectMember,
  ApiProjectStatus,
  ApiTask,
  ApiUser,
} from '@/api/types'
import {
  makeApiProject,
  makeApiProjectMember,
  makeApiProjectStatus,
  makeApiUser,
} from './fixtures'

export interface MockRequestLogEntry {
  method: string
  url: string
  pathname: string
  searchParams: Record<string, string[]>
  headers: Record<string, string>
  credentials?: RequestCredentials
  body: unknown
}

export interface MockData {
  me: ApiUser | null
  users: ApiUser[]
  projects: ApiProject[]
  members: ApiProjectMember[]
  statuses: ApiProjectStatus[]
  tasks: ApiTask[]
  taskTags: Record<string, string[]>
  requestLog: MockRequestLogEntry[]
  nextProjectID: string
  nextTaskID: string
  completionNextTasks: Record<string, ApiTask | null | undefined>
}

export interface MockSeed {
  me?: ApiUser | null
  users?: ApiUser[]
  projects?: ApiProject[]
  members?: ApiProjectMember[]
  statuses?: ApiProjectStatus[]
  tasks?: ApiTask[]
  taskTags?: Record<string, string[]>
  nextProjectID?: string
  nextTaskID?: string
  completionNextTasks?: Record<string, ApiTask | null | undefined>
}

const DEFAULT_STATUSES = ['todo', 'in_progress', 'done', 'cancelled']

function cloneTask(task: ApiTask): ApiTask {
  return { ...task }
}

function cloneProject(project: ApiProject): ApiProject {
  return { ...project }
}

function cloneMember(member: ApiProjectMember): ApiProjectMember {
  return { ...member }
}

function cloneStatus(status: ApiProjectStatus): ApiProjectStatus {
  return { ...status }
}

function cloneUser(user: ApiUser): ApiUser {
  return { ...user }
}

function cloneSeed(seed: MockSeed): MockSeed {
  return {
    me: seed.me ? cloneUser(seed.me) : seed.me ?? undefined,
    users: seed.users?.map(cloneUser),
    projects: seed.projects?.map(cloneProject),
    members: seed.members?.map(cloneMember),
    statuses: seed.statuses?.map(cloneStatus),
    tasks: seed.tasks?.map(cloneTask),
    taskTags: seed.taskTags ? Object.fromEntries(Object.entries(seed.taskTags).map(([key, value]) => [key, [...value]])) : undefined,
    nextProjectID: seed.nextProjectID,
    nextTaskID: seed.nextTaskID,
    completionNextTasks: seed.completionNextTasks
      ? Object.fromEntries(
          Object.entries(seed.completionNextTasks).map(([key, value]) => [key, value ? cloneTask(value) : value]),
        )
      : undefined,
  }
}

function defaultState(): MockData {
  const me = makeApiUser()
  const project = makeApiProject({ owner_id: me.id, effective_role: 'admin' })
  return {
    me,
    users: [me],
    projects: [project],
    members: [makeApiProjectMember({ project_id: project.id, user_id: me.id, role: 'admin' })],
    statuses: DEFAULT_STATUSES.map((status, position) =>
      makeApiProjectStatus({ project_id: project.id, status, position }),
    ),
    tasks: [],
    taskTags: {},
    requestLog: [],
    nextProjectID: 'p-new',
    nextTaskID: 't-new',
    completionNextTasks: {},
  }
}

const state = defaultState()

function assignState(next: MockData): void {
  state.me = next.me ? cloneUser(next.me) : null
  state.users = next.users.map(cloneUser)
  state.projects = next.projects.map(cloneProject)
  state.members = next.members.map(cloneMember)
  state.statuses = next.statuses.map(cloneStatus)
  state.tasks = next.tasks.map(cloneTask)
  state.taskTags = Object.fromEntries(
    Object.entries(next.taskTags).map(([key, value]) => [key, [...value]]),
  )
  state.requestLog = next.requestLog.map((entry) => ({
    ...entry,
    searchParams: Object.fromEntries(
      Object.entries(entry.searchParams).map(([key, value]) => [key, [...value]]),
    ),
  }))
  state.nextProjectID = next.nextProjectID
  state.nextTaskID = next.nextTaskID
  state.completionNextTasks = Object.fromEntries(
    Object.entries(next.completionNextTasks).map(([key, value]) => [key, value ? cloneTask(value) : value]),
  )
}

export function resetMockData(seed: MockSeed = {}): void {
  const base = defaultState()
  const next: MockData = {
    me: seed.me !== undefined ? (seed.me ? cloneUser(seed.me) : null) : base.me,
    users: seed.users ? seed.users.map(cloneUser) : base.users,
    projects: seed.projects ? seed.projects.map(cloneProject) : base.projects,
    members: seed.members ? seed.members.map(cloneMember) : base.members,
    statuses: seed.statuses ? seed.statuses.map(cloneStatus) : base.statuses,
    tasks: seed.tasks ? seed.tasks.map(cloneTask) : base.tasks,
    taskTags: seed.taskTags
      ? Object.fromEntries(Object.entries(seed.taskTags).map(([key, value]) => [key, [...value]]))
      : base.taskTags,
    requestLog: [],
    nextProjectID: seed.nextProjectID ?? base.nextProjectID,
    nextTaskID: seed.nextTaskID ?? base.nextTaskID,
    completionNextTasks: seed.completionNextTasks
      ? Object.fromEntries(
          Object.entries(seed.completionNextTasks).map(([key, value]) => [key, value ? cloneTask(value) : value]),
        )
      : {},
  }

  if (next.me && !next.users.some((user) => user.id === next.me?.id)) {
    next.users = [...next.users, cloneUser(next.me)]
  }

  assignState(next)
}

export function seedMockData(seed: MockSeed): void {
  resetMockData({
    ...cloneSeed(seed),
  })
}

export function getMockData(): MockData {
  return {
    me: state.me ? cloneUser(state.me) : null,
    users: state.users.map(cloneUser),
    projects: state.projects.map(cloneProject),
    members: state.members.map(cloneMember),
    statuses: state.statuses.map(cloneStatus),
    tasks: state.tasks.map(cloneTask),
    taskTags: Object.fromEntries(
      Object.entries(state.taskTags).map(([key, value]) => [key, [...value]]),
    ),
    requestLog: state.requestLog.map((entry) => ({
      ...entry,
      searchParams: Object.fromEntries(
        Object.entries(entry.searchParams).map(([key, value]) => [key, [...value]]),
      ),
    })),
    nextProjectID: state.nextProjectID,
    nextTaskID: state.nextTaskID,
    completionNextTasks: Object.fromEntries(
      Object.entries(state.completionNextTasks).map(([key, value]) => [key, value ? cloneTask(value) : value]),
    ),
  }
}

export function getLastRequest(): MockRequestLogEntry | undefined {
  return state.requestLog[state.requestLog.length - 1]
}

export function getRequestLog(): MockRequestLogEntry[] {
  return getMockData().requestLog
}

export function clearRequestLog(): void {
  state.requestLog = []
}

export async function captureRequest(request: Request): Promise<MockRequestLogEntry> {
  const url = new URL(request.url)
  let body: unknown = undefined
  const contentType = request.headers.get('content-type') ?? ''

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType.includes('application/json')) {
      body = await request.clone().json()
    } else if (request.body !== null) {
      body = await request.clone().text()
    }
  }

  const searchParams: Record<string, string[]> = {}
  for (const [key, value] of url.searchParams.entries()) {
    searchParams[key] ??= []
    searchParams[key]!.push(value)
  }

  const entry: MockRequestLogEntry = {
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    searchParams,
    headers: Object.fromEntries(request.headers.entries()),
    credentials: request.credentials,
    body,
  }

  state.requestLog.push(entry)
  return entry
}

export function listTasksByProject(projectID: string, filters?: { status?: string; assigneeID?: string; tag?: string }): ApiTask[] {
  return state.tasks
    .filter((task) => task.project_id === projectID)
    .filter((task) => task.parent_id === undefined)
    .filter((task) => (filters?.status ? task.status === filters.status : true))
    .filter((task) => (filters?.assigneeID ? task.assignee_id === filters.assigneeID : true))
    .filter((task) => (filters?.tag ? (state.taskTags[task.id] ?? []).includes(filters.tag) : true))
    .sort((a, b) => a.position - b.position)
    .map(cloneTask)
}

export function listSubtasks(parentID: string): ApiTask[] {
  return state.tasks
    .filter((task) => task.parent_id === parentID)
    .sort((a, b) => a.position - b.position)
    .map(cloneTask)
}

export function listProjectStatuses(projectID: string): ApiProjectStatus[] {
  return state.statuses
    .filter((status) => status.project_id === projectID)
    .sort((a, b) => a.position - b.position)
    .map(cloneStatus)
}

export function listProjectMembers(projectID: string): ApiProjectMember[] {
  const explicitMembers = state.members.filter((member) => member.project_id === projectID)
  const project = state.projects.find((entry) => entry.id === projectID)

  if (!project) {
    return explicitMembers.map(cloneMember)
  }

  const members = explicitMembers.filter((member) => member.user_id !== project.owner_id)
  return [
    makeApiProjectMember({ project_id: projectID, user_id: project.owner_id, role: 'admin' }),
    ...members.map(cloneMember),
  ]
}

export function addProjectMember(projectID: string, userID: string, role: ApiProjectMember['role']): ApiProjectMember {
  const existing = state.members.find(
    (member) => member.project_id === projectID && member.user_id === userID,
  )

  if (existing) {
    existing.role = role
    return cloneMember(existing)
  }

  const member = makeApiProjectMember({ project_id: projectID, user_id: userID, role })
  state.members.push(member)
  return cloneMember(member)
}

export function updateProjectMember(projectID: string, userID: string, role: ApiProjectMember['role']): ApiProjectMember | undefined {
  const project = state.projects.find((entry) => entry.id === projectID)
  if (!project) {
    return undefined
  }

  if (project.owner_id === userID) {
    return makeApiProjectMember({ project_id: projectID, user_id: userID, role: 'admin' })
  }

  const member = state.members.find(
    (entry) => entry.project_id === projectID && entry.user_id === userID,
  )
  if (!member) {
    return undefined
  }

  member.role = role
  return cloneMember(member)
}

export function removeProjectMember(projectID: string, userID: string): { reassigned: number } | undefined {
  const project = state.projects.find((entry) => entry.id === projectID)
  if (!project || project.owner_id === userID) {
    return undefined
  }

  const index = state.members.findIndex(
    (member) => member.project_id === projectID && member.user_id === userID,
  )
  if (index === -1) {
    return undefined
  }

  let reassigned = 0
  for (const task of state.tasks) {
    if (task.project_id === projectID && task.assignee_id === userID) {
      task.assignee_id = project.owner_id
      task.updated_at = nextTimestamp(task.updated_at)
      reassigned += 1
    }
  }

  state.members.splice(index, 1)
  return { reassigned }
}

export function listGlobalTags(): string[] {
  return Array.from(new Set(Object.values(state.taskTags).flat()))
}

export function getTaskTags(taskID: string): string[] {
  return [...(state.taskTags[taskID] ?? [])]
}

export function setTaskTags(taskID: string, tags: string[]): void {
  state.taskTags[taskID] = [...new Set(tags)]
}

export function addTaskTag(taskID: string, tag: string): void {
  setTaskTags(taskID, [...getTaskTags(taskID), tag])
}

export function removeTaskTag(taskID: string, tag: string): void {
  setTaskTags(
    taskID,
    getTaskTags(taskID).filter((existingTag) => existingTag !== tag),
  )
}

function nextTimestamp(previous?: string): string {
  const base = previous ? new Date(previous).getTime() : Date.now()
  return new Date(base + 1000).toISOString()
}

function getNextPosition(projectID: string, parentID: string | undefined, status: string): number {
  const siblings = state.tasks.filter(
    (task) =>
      task.project_id === projectID &&
      task.status === status &&
      task.parent_id === parentID,
  )
  return siblings.length
}

function getFirstProjectStatus(projectID: string): string {
  return (
    listProjectStatuses(projectID)[0]?.status ??
    'todo'
  )
}

export function createProject(input: Partial<ApiProject> & Pick<ApiProject, 'name'>): ApiProject {
  const now = nextTimestamp()
  const project = makeApiProject({
    id: state.nextProjectID,
    name: input.name,
    description: input.description,
    due_date: input.due_date,
    assignee_id: input.assignee_id,
    owner_id: input.owner_id ?? state.me?.id ?? 'dev-user',
    effective_role: 'admin',
    created_at: now,
    updated_at: now,
  })
  state.nextProjectID = `p-${state.projects.length + 2}`
  state.projects.push(project)
  state.statuses.push(
    ...DEFAULT_STATUSES.map((status, position) =>
      makeApiProjectStatus({ project_id: project.id, status, position }),
    ),
  )
  return cloneProject(project)
}

export function updateProject(projectID: string, patch: Partial<ApiProject>): ApiProject | undefined {
  const project = state.projects.find((entry) => entry.id === projectID)
  if (!project) {
    return undefined
  }
  Object.assign(project, patch, { updated_at: nextTimestamp(project.updated_at) })
  return cloneProject(project)
}

export function deleteProject(projectID: string): boolean {
  const index = state.projects.findIndex((project) => project.id === projectID)
  if (index === -1) {
    return false
  }
  state.projects.splice(index, 1)
  state.members = state.members.filter((member) => member.project_id !== projectID)
  state.statuses = state.statuses.filter((status) => status.project_id !== projectID)
  const taskIDs = state.tasks.filter((task) => task.project_id === projectID).map((task) => task.id)
  state.tasks = state.tasks.filter((task) => task.project_id !== projectID)
  for (const taskID of taskIDs) {
    delete state.taskTags[taskID]
    delete state.completionNextTasks[taskID]
  }
  return true
}

export function createTask(
  projectID: string,
  input: Partial<ApiTask> & Pick<ApiTask, 'name'>,
): ApiTask {
  const status = input.status ?? getFirstProjectStatus(projectID)
  const now = nextTimestamp()
  const task: ApiTask = {
    id: state.nextTaskID,
    project_id: projectID,
    name: input.name,
    status,
    owner_id: input.owner_id ?? state.me?.id ?? 'dev-user',
    position: input.position ?? getNextPosition(projectID, input.parent_id, status),
    created_at: now,
    updated_at: now,
    ...(input.parent_id ? { parent_id: input.parent_id } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.due_date ? { due_date: input.due_date } : {}),
    ...(input.assignee_id ? { assignee_id: input.assignee_id } : {}),
    ...(input.recurrence ? { recurrence: input.recurrence } : {}),
  }
  state.nextTaskID = `t-${state.tasks.length + 2}`
  state.tasks.push(task)
  return cloneTask(task)
}

export function updateTask(taskID: string, patch: Partial<ApiTask>): ApiTask | undefined {
  const task = state.tasks.find((entry) => entry.id === taskID)
  if (!task) {
    return undefined
  }

  if (patch.project_id !== undefined) {
    task.project_id = patch.project_id
  }

  if (patch.name !== undefined) {
    task.name = patch.name
  }

  if (patch.description !== undefined) {
    if (patch.description) {
      task.description = patch.description
    } else {
      delete task.description
    }
  }

  const previousStatus = task.status
  if (patch.status !== undefined) {
    task.status = patch.status
  }

  if (patch.position !== undefined) {
    task.position = patch.position
  } else if (patch.status !== undefined && patch.status !== previousStatus) {
    task.position = getNextPosition(task.project_id, task.parent_id, task.status)
  }

  if (patch.parent_id !== undefined) {
    if (patch.parent_id) {
      task.parent_id = patch.parent_id
    } else {
      delete task.parent_id
    }
  }

  if (patch.due_date !== undefined) {
    if (patch.due_date) {
      task.due_date = patch.due_date
    } else {
      delete task.due_date
    }
  }

  if (patch.assignee_id !== undefined) {
    if (patch.assignee_id) {
      task.assignee_id = patch.assignee_id
    } else {
      delete task.assignee_id
    }
  }

  if (patch.recurrence !== undefined) {
    if (patch.recurrence) {
      task.recurrence = patch.recurrence
    } else {
      delete task.recurrence
    }
  }

  task.updated_at = nextTimestamp(task.updated_at)
  return cloneTask(task)
}

export function deleteTask(taskID: string): boolean {
  const childIDs = state.tasks
    .filter((task) => task.parent_id === taskID)
    .map((task) => task.id)

  for (const childID of childIDs) {
    deleteTask(childID)
  }

  const index = state.tasks.findIndex((task) => task.id === taskID)
  if (index === -1) {
    return false
  }

  state.tasks.splice(index, 1)
  delete state.taskTags[taskID]
  delete state.completionNextTasks[taskID]
  return true
}

export function completeTask(taskID: string, doneStatus: string): { completed: ApiTask; next: ApiTask | null } | undefined {
  const completed = updateTask(taskID, { status: doneStatus })
  if (!completed) {
    return undefined
  }
  const next = state.completionNextTasks[taskID] ?? null
  if (next) {
    state.tasks.push(cloneTask(next))
  }
  delete state.completionNextTasks[taskID]
  return {
    completed,
    next: next ? cloneTask(next) : null,
  }
}

export function setCompletionNextTask(taskID: string, nextTask: ApiTask | null): void {
  state.completionNextTasks[taskID] = nextTask ? cloneTask(nextTask) : null
}

export function getProject(projectID: string): ApiProject | undefined {
  const project = state.projects.find((entry) => entry.id === projectID)
  return project ? cloneProject(project) : undefined
}

export function getTask(taskID: string): ApiTask | undefined {
  const task = state.tasks.find((entry) => entry.id === taskID)
  return task ? cloneTask(task) : undefined
}

export function getUser(userID: string): ApiUser | undefined {
  const user = state.users.find((entry) => entry.id === userID)
  return user ? cloneUser(user) : undefined
}

export function searchUsers(search: string, limit: number): ApiUser[] {
  const normalizedQuery = search.trim().toLowerCase()
  return state.users
    .filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery),
    )
    .slice(0, limit)
    .map(cloneUser)
}

export function listUsersByIDs(ids: string[]): ApiUser[] {
  return state.users
    .filter((user) => ids.includes(user.id))
    .map(cloneUser)
}
