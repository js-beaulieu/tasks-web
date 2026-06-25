import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { Task } from '@/api/tasks'
import type { User } from '@/api/users'

const createMutate = vi.fn<(input: { projectID: string; input: { name: string; status: string; assigneeId?: string } }) => void>()
const updateMutate = vi.fn<(
  input: { taskID: string; input: { status?: string; position?: number } },
  opts?: { onError?: () => void },
) => void>()

vi.mock('@/composables/tasks/useCreateTask', () => ({
  useCreateTask: () => ({
    mutate: createMutate,
    isPending: ref(false),
  }),
}))

vi.mock('@/composables/tasks/useUpdateTask', () => ({
  useUpdateTask: () => ({
    mutate: updateMutate,
    isPending: ref(false),
  }),
}))

import { useTaskActions } from './useTaskActions'

function makeTask(partial: Partial<Task> = {}): Task {
  return {
    id: 't1',
    projectId: 'p1',
    parentId: null,
    name: 'Test task',
    description: null,
    status: 'todo',
    dueDate: null,
    ownerId: 'dev-user',
    assigneeId: null,
    position: 0,
    recurrence: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...partial,
  }
}

function makeUser(partial: Partial<User> = {}): User {
  return {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@example.com',
    createdAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('useTaskActions', () => {
  beforeEach(() => {
    createMutate.mockReset()
    updateMutate.mockReset()
  })

  it('handleQuickAdd creates a task with projectID, name, status, and assignee', () => {
    const state = useTaskActions(
      ref('p1'),
      ref([]),
      ref(makeUser({ id: 'u1' })),
      ref('done'),
      ref('todo'),
    )

    state.handleQuickAdd('todo', 'New task')

    expect(createMutate).toHaveBeenCalledWith({
      projectID: 'p1',
      input: {
        name: 'New task',
        status: 'todo',
        assigneeId: 'u1',
      },
    })
  })

  it('handleCompleteTask uses doneStatus and increments dragResetKey on error', () => {
    const state = useTaskActions(ref('p1'), ref([]), ref(undefined), ref('done'), ref('todo'))

    state.handleCompleteTask('t1')

    expect(updateMutate).toHaveBeenCalledTimes(1)
    const [payload, opts] = updateMutate.mock.calls[0]!
    expect(payload).toEqual({ taskID: 't1', input: { status: 'done' } })
    expect(state.dragResetKey.value).toBe(0)
    opts?.onError?.()
    expect(state.dragResetKey.value).toBe(1)
  })

  it('handleUncompleteTask uses firstStatus', () => {
    const state = useTaskActions(ref('p1'), ref([]), ref(undefined), ref('done'), ref('todo'))

    state.handleUncompleteTask('t1')

    expect(updateMutate).toHaveBeenCalledWith({ taskID: 't1', input: { status: 'todo' } })
  })

  it('handleMoveStatus updates status and increments dragResetKey on error', () => {
    const state = useTaskActions(ref('p1'), ref([]), ref(undefined), ref('done'), ref('todo'))

    state.handleMoveStatus('t1', 'in_progress')

    const [payload, opts] = updateMutate.mock.calls[0]!
    expect(payload).toEqual({ taskID: 't1', input: { status: 'in_progress' } })
    opts?.onError?.()
    expect(state.dragResetKey.value).toBe(1)
  })

  it('handleReorder sends position and optional status', () => {
    const state = useTaskActions(ref('p1'), ref([]), ref(undefined), ref('done'), ref('todo'))

    state.handleReorder('t1', 3, 'done')

    expect(updateMutate).toHaveBeenCalledWith(
      { taskID: 't1', input: { position: 3, status: 'done' } },
      expect.any(Object),
    )
  })

  it('handleDeleteTask sets deleteTaskID and deleteTaskObj resolves from tasks', () => {
    const tasks = ref([makeTask({ id: 't1' }), makeTask({ id: 't2' })])
    const state = useTaskActions(ref('p1'), tasks, ref(undefined), ref('done'), ref('todo'))

    state.handleDeleteTask('t2')

    expect(state.deleteTaskID.value).toBe('t2')
    expect(state.deleteTaskObj.value?.id).toBe('t2')
  })

  it('deleteTaskObj is null when deleteTaskID is null', () => {
    const state = useTaskActions(ref('p1'), ref([makeTask()]), ref(undefined), ref('done'), ref('todo'))
    expect(state.deleteTaskObj.value).toBeNull()
  })
})
