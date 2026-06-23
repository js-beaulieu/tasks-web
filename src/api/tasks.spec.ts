import { describe, it, expect, beforeEach } from 'vitest'
import { makeApiTask } from '@/test/mocks/fixtures'
import {
  getLastRequest,
  seedMockData,
  setCompletionNextTask,
} from '@/test/mocks/state'
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

beforeEach(() => {
  seedMockData({
    tasks: [makeApiTask({ id: 't1', project_id: 'p1', owner_id: 'u1' })],
    taskTags: {},
  })
})

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
    const result = await listProjectTasks('p1')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/tasks')
    expect(result).toEqual([expectedTask])
  })

  it('passes filters as query parameters', async () => {
    await listProjectTasks('p1', { status: 'todo', assigneeId: 'u1' })

    expect(getLastRequest()?.searchParams).toEqual({
      status: ['todo'],
      assignee_id: ['u1'],
    })
  })

  it('encodes project ID in URL', async () => {
    await listProjectTasks('proj/special')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/proj%2Fspecial/tasks')
  })
})

describe('getTask', () => {
  it('fetches and maps a single task', async () => {
    const result = await getTask('t1')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1')
    expect(result).toEqual(expectedTask)
  })
})

describe('createTask', () => {
  it('creates a task with name only', async () => {
    seedMockData({ tasks: [], nextTaskID: 't1' })

    const result = await createTask('p1', { name: 'Test task' })

    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ name: 'Test task' })
    expect(result.name).toBe('Test task')
  })

  it('includes optional fields when provided', async () => {
    seedMockData({ tasks: [], nextTaskID: 't1' })

    await createTask('p1', {
      name: 'Test',
      description: ' Desc ',
      status: 'in_progress',
      assigneeId: 'u2',
      dueDate: '2026-06-15',
    })

    expect(getLastRequest()?.body).toEqual({
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
    const result = await updateTask('t1', { status: 'in_progress', position: 5 })

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1')
    expect(getLastRequest()?.method).toBe('PATCH')
    expect(getLastRequest()?.body).toEqual({ status: 'in_progress', position: 5 })
    expect(result.status).toBe('in_progress')
    expect(result.position).toBe(5)
  })

  it('sends null parentId to detach subtask', async () => {
    seedMockData({
      tasks: [makeApiTask({ id: 't1', project_id: 'p1', parent_id: 'parent-1', owner_id: 'u1' })],
    })

    const result = await updateTask('t1', { parentId: null })

    expect(getLastRequest()?.body).toEqual({ parent_id: null })
    expect(result.parentId).toBeNull()
  })

  it('sends project_id for cross-project move', async () => {
    seedMockData({
      tasks: [makeApiTask({ id: 't1', project_id: 'p1', owner_id: 'u1' })],
    })

    const result = await updateTask('t1', { projectId: 'p2' })

    expect(getLastRequest()?.body).toEqual({ project_id: 'p2' })
    expect(result.projectId).toBe('p2')
  })
})

describe('deleteTask', () => {
  it('sends DELETE request', async () => {
    await deleteTask('t1')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1')
    expect(getLastRequest()?.method).toBe('DELETE')
  })
})

describe('completeTask', () => {
  it('sends done_status and maps response', async () => {
    const result = await completeTask('t1', 'done')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/complete')
    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ done_status: 'done' })
    expect(result.completed.status).toBe('done')
    expect(result.next).toBeNull()
  })

  it('maps next task for recurring completion', async () => {
    const nextTask = makeApiTask({ id: 't2', project_id: 'p1', status: 'todo', owner_id: 'u1' })
    setCompletionNextTask('t1', nextTask)

    const result = await completeTask('t1', 'done')

    expect(result.next).not.toBeNull()
    expect(result.next?.id).toBe('t2')
  })
})

describe('listSubtasks', () => {
  it('fetches and maps subtasks', async () => {
    seedMockData({
      tasks: [makeApiTask({ id: 't2', project_id: 'p1', parent_id: 't1', owner_id: 'u1' })],
    })

    const result = await listSubtasks('t1')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tasks')
    expect(result[0]?.parentId).toBe('t1')
  })
})

describe('createSubtask', () => {
  it('creates subtask under parent', async () => {
    seedMockData({
      tasks: [makeApiTask({ id: 't1', project_id: 'p1', owner_id: 'u1' })],
      nextTaskID: 's1',
    })

    const result = await createSubtask('t1', { name: 'Sub' })

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tasks')
    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ name: 'Sub' })
    expect(result.parentId).toBe('t1')
  })
})

describe('task tags', () => {
  it('lists task tags', async () => {
    seedMockData({ taskTags: { t1: ['urgent', 'bug'] } })

    const result = await listTaskTags('t1')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tags')
    expect(result).toEqual(['urgent', 'bug'])
  })

  it('adds a tag', async () => {
    await addTaskTag('t1', 'urgent')

    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ tag: 'urgent' })
  })

  it('removes a tag', async () => {
    await removeTaskTag('t1', 'urgent')

    expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tags/urgent')
    expect(getLastRequest()?.method).toBe('DELETE')
  })
})
