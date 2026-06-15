import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, apiList } from '@/api/client'
import {
  listProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  listSubtasks,
  createSubtask,
  listTaskTags,
  addTaskTag,
  removeTaskTag,
  type Task,
} from './tasks'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function mockApiTask(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 't1',
    project_id: 'p1',
    parent_id: null,
    name: 'Test task',
    description: null,
    status: 'todo',
    due_date: null,
    owner_id: 'u1',
    assignee_id: null,
    position: 0,
    recurrence: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...partial,
  }
}

const expectedTask: Task = {
  id: 't1',
  projectId: 'p1',
  parentId: null,
  name: 'Test task',
  description: null,
  status: 'todo',
  dueDate: null,
  ownerId: 'u1',
  assigneeId: null,
  position: 0,
  recurrence: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

describe('listProjectTasks', () => {
  it('fetches and maps tasks', async () => {
    vi.mocked(apiList).mockResolvedValue([mockApiTask()])

    const result = await listProjectTasks('p1')

    expect(apiList).toHaveBeenCalledWith('projects/p1/tasks')
    expect(result).toEqual([expectedTask])
  })

  it('passes filters as query parameters', async () => {
    vi.mocked(apiList).mockResolvedValue([])

    await listProjectTasks('p1', { status: 'todo', assigneeId: 'u1' })

    expect(apiList).toHaveBeenCalledWith(
      'projects/p1/tasks?status=todo&assignee_id=u1',
    )
  })

  it('encodes project ID in URL', async () => {
    vi.mocked(apiList).mockResolvedValue([])

    await listProjectTasks('proj/special')

    expect(apiList).toHaveBeenCalledWith('projects/proj%2Fspecial/tasks')
  })
})

describe('getTask', () => {
  it('fetches and maps a single task', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask())

    const result = await getTask('t1')

    expect(apiClient).toHaveBeenCalledWith('tasks/t1')
    expect(result).toEqual(expectedTask)
  })
})

describe('createTask', () => {
  it('creates a task with name only', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask())

    await createTask('p1', { name: 'Test task' })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ name: 'Test task' })
  })

  it('includes optional fields when provided', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask())

    await createTask('p1', {
      name: 'Test',
      description: ' Desc ',
      status: 'in_progress',
      assigneeId: 'u2',
      dueDate: '2026-06-15',
    })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(options.body).toEqual({
      name: 'Test',
      description: 'Desc',
      status: 'in_progress',
      assignee_id: 'u2',
      due_date: '2026-06-15',
    })
  })
})

describe('updateTask', () => {
  it('patches task fields', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask({ status: 'in_progress' }))

    await updateTask('t1', { status: 'in_progress', position: 5 })

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(path).toBe('tasks/t1')
    expect(options.method).toBe('PATCH')
    expect(options.body).toEqual({ status: 'in_progress', position: 5 })
  })

  it('sends null parentId to detach subtask', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask())

    await updateTask('t1', { parentId: null })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(options.body).toEqual({ parent_id: null })
  })
})

describe('deleteTask', () => {
  it('sends DELETE request', async () => {
    vi.mocked(apiClient).mockResolvedValue(undefined)

    await deleteTask('t1')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string },
    ]
    expect(path).toBe('tasks/t1')
    expect(options.method).toBe('DELETE')
  })
})

describe('completeTask', () => {
  it('sends done_status and maps response', async () => {
    vi.mocked(apiClient).mockResolvedValue({
      completed: mockApiTask({ status: 'done' }),
      next: null,
    })

    const result = await completeTask('t1', 'done')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(path).toBe('tasks/t1/complete')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ done_status: 'done' })
    expect(result.completed.status).toBe('done')
    expect(result.next).toBeNull()
  })

  it('maps next task for recurring completion', async () => {
    const nextTask = mockApiTask({ id: 't2', status: 'todo' })
    vi.mocked(apiClient).mockResolvedValue({
      completed: mockApiTask({ status: 'done' }),
      next: nextTask,
    })

    const result = await completeTask('t1', 'done')

    expect(result.next).not.toBeNull()
    expect(result.next!.id).toBe('t2')
  })
})

describe('listSubtasks', () => {
  it('fetches and maps subtasks', async () => {
    vi.mocked(apiList).mockResolvedValue([mockApiTask({ parent_id: 't1' })])

    const result = await listSubtasks('t1')

    expect(apiList).toHaveBeenCalledWith('tasks/t1/tasks')
    expect(result[0]!.parentId).toBe('t1')
  })
})

describe('createSubtask', () => {
  it('creates subtask under parent', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiTask({ parent_id: 't1' }))

    await createSubtask('t1', { name: 'Sub' })

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(path).toBe('tasks/t1/tasks')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ name: 'Sub' })
  })
})

describe('task tags', () => {
  it('lists task tags', async () => {
    vi.mocked(apiList).mockResolvedValue(['urgent', 'bug'])

    const result = await listTaskTags('t1')

    expect(apiList).toHaveBeenCalledWith('tasks/t1/tags')
    expect(result).toEqual(['urgent', 'bug'])
  })

  it('adds a tag', async () => {
    vi.mocked(apiClient).mockResolvedValue(undefined)

    await addTaskTag('t1', 'urgent')

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ tag: 'urgent' })
  })

  it('removes a tag', async () => {
    vi.mocked(apiClient).mockResolvedValue(undefined)

    await removeTaskTag('t1', 'urgent')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string },
    ]
    expect(path).toBe('tasks/t1/tags/urgent')
    expect(options.method).toBe('DELETE')
  })
})