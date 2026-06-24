export type TaskFilters = { status?: string; assigneeId?: string; tag?: string }

export const qk = {
  me: () => ['me'] as const,
  tags: () => ['tags'] as const,

  projects: () => ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectTasks: (id: string, filters?: TaskFilters) => ['projects', id, 'tasks', filters] as const,
  projectStatuses: (id: string) => ['projects', id, 'statuses'] as const,
  projectMembers: (id: string) => ['projects', id, 'members'] as const,

  task: (id: string | undefined) => ['tasks', id] as const,
  taskTags: (id: string | undefined) => ['tasks', id, 'tags'] as const,
  taskSubtasks: (id: string | undefined) => ['tasks', id, 'subtasks'] as const,

  tasks: () => ['tasks'] as const,

  usersByID: (ids: string[]) => ['users', 'by-id', ids] as const,
  userSearch: (query: string, limit: number) => ['users', 'search', query, limit] as const,
} as const