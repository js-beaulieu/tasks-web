import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTaskEditState } from './useTaskEditState'
import type { Task } from '@/api/tasks'

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

describe('useTaskEditState', () => {
  const baseTask = makeTask({
    id: 't1',
    projectId: 'p1',
    name: 'My task',
    description: 'A description',
    status: 'todo',
    assigneeId: 'u1',
    dueDate: null,
    recurrence: 'FREQ=DAILY',
  })

  it('populates edit fields from the initial task', () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    expect(state.editName.value).toBe('My task')
    expect(state.editDescription.value).toBe('A description')
    expect(state.editProjectId.value).toBe('p1')
    expect(state.editStatus.value).toBe('todo')
    expect(state.editAssigneeId.value).toBe('u1')
    expect(state.editRecurrence.value).toBe('FREQ=DAILY')
    expect(state.dirty.value).toBe(false)
  })

  it('sets dirty to true when a field changes', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editName.value = 'Changed name'
    await nextTick()

    expect(state.dirty.value).toBe(true)
  })

  it('sets dirty back to false after resetEditFields', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editName.value = 'Changed'
    await nextTick()
    expect(state.dirty.value).toBe(true)

    state.resetEditFields(baseTask)
    expect(state.dirty.value).toBe(false)
  })

  it('buildUpdateInput returns empty object when nothing changed', () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    const input = state.buildUpdateInput()
    expect(input).toEqual({})
  })

  it('buildUpdateInput includes only changed fields', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editName.value = 'New name'
    state.editStatus.value = 'in_progress'
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.name).toBe('New name')
    expect(input.status).toBe('in_progress')
    expect(input.description).toBeUndefined()
    expect(input.projectId).toBeUndefined()
  })

  it('buildUpdateInput sets assigneeId to null when changed to __none__', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editAssigneeId.value = '__none__'
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.assigneeId).toBeNull()
  })

  it('buildUpdateInput sets description to undefined when changed to empty', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editDescription.value = ''
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.description).toBeUndefined()
  })

  it('buildUpdateInput includes recurrence when changed', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editRecurrence.value = 'FREQ=WEEKLY'
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.recurrence).toBe('FREQ=WEEKLY')
  })

  it('buildUpdateInput includes recurrence null when cleared', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editRecurrence.value = null
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.recurrence).toBeNull()
  })

  it('buildUpdateInput includes projectId when changed for cross-project move', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editProjectId.value = 'p2'
    await nextTick()

    const input = state.buildUpdateInput()
    expect(input.projectId).toBe('p2')
  })

  it('re-syncs edit fields when task ref changes', async () => {
    const task = ref(baseTask)
    const state = useTaskEditState(task)

    state.editName.value = 'temp edit'
    await nextTick()

    task.value = makeTask({ id: 't2', name: 'Other task', projectId: 'p2', status: 'done' })
    await nextTick()

    expect(state.editName.value).toBe('Other task')
    expect(state.editProjectId.value).toBe('p2')
    expect(state.editStatus.value).toBe('done')
    expect(state.dirty.value).toBe(false)
  })

  it('handles task with null assignee (defaults to __none__)', () => {
    const task = ref(makeTask({ assigneeId: null }))
    const state = useTaskEditState(task)

    expect(state.editAssigneeId.value).toBe('__none__')
  })

  it('handles task with null dueDate', () => {
    const task = ref(makeTask({ dueDate: null }))
    const state = useTaskEditState(task)

    expect(state.editDueDate.value).toBeUndefined()
  })

  it('handles task with null recurrence', () => {
    const task = ref(makeTask({ recurrence: null }))
    const state = useTaskEditState(task)

    expect(state.editRecurrence.value).toBeNull()
  })

  it('returns empty input when task is undefined', () => {
    const task = ref<Task | undefined>(undefined)
    const state = useTaskEditState(task)

    const input = state.buildUpdateInput()
    expect(input).toEqual({})
  })
})
