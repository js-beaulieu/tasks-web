import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTaskGroups } from './useTaskGroups'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'

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

function makeStatus(partial: Partial<ProjectStatus> = {}): ProjectStatus {
  return {
    projectId: 'p1',
    status: 'todo',
    position: 0,
    ...partial,
  }
}

describe('useTaskGroups', () => {
  it('groups tasks by status', () => {
    const tasks = ref([
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'in_progress' }),
      makeTask({ id: 't3', status: 'todo' }),
    ])
    const statuses = ref([
      makeStatus({ status: 'todo', position: 0 }),
      makeStatus({ status: 'in_progress', position: 1 }),
      makeStatus({ status: 'done', position: 2 }),
    ])

    const { groupedTasks } = useTaskGroups(tasks, statuses)
    expect(groupedTasks.value).toHaveLength(3)
    expect(groupedTasks.value[0]!.status).toBe('todo')
    expect(groupedTasks.value[0]!.tasks).toHaveLength(2)
    expect(groupedTasks.value[1]!.status).toBe('in_progress')
    expect(groupedTasks.value[1]!.tasks).toHaveLength(1)
    expect(groupedTasks.value[2]!.status).toBe('done')
    expect(groupedTasks.value[2]!.tasks).toHaveLength(0)
  })

  it('includes custom statuses from the status list', () => {
    const tasks = ref([])
    const statuses = ref([
      makeStatus({ status: 'review', position: 0 }),
      makeStatus({ status: 'todo', position: 1 }),
    ])

    const { groupedTasks } = useTaskGroups(tasks, statuses)
    expect(groupedTasks.value.find((g) => g.status === 'review')).toBeDefined()
  })

  it('does not introduce custom statuses that are not in the status list', () => {
    const tasks = ref([makeTask({ id: 't1', status: 'custom' })])
    const statuses = ref([makeStatus({ status: 'todo', position: 0 })])

    const { groupedTasks } = useTaskGroups(tasks, statuses)
    expect(groupedTasks.value.find((g) => g.status === 'custom')).toBeUndefined()
  })

  it('doneStatus returns done when present', () => {
    const statuses = ref([
      makeStatus({ status: 'todo', position: 0 }),
      makeStatus({ status: 'done', position: 1 }),
    ])

    const { doneStatus } = useTaskGroups(ref([]), statuses)
    expect(doneStatus.value).toBe('done')
  })

  it('doneStatus defaults to "done" when not in status list', () => {
    const statuses = ref([makeStatus({ status: 'todo', position: 0 })])

    const { doneStatus } = useTaskGroups(ref([]), statuses)
    expect(doneStatus.value).toBe('done')
  })

  it('firstStatus returns first status by position', () => {
    const statuses = ref([
      makeStatus({ status: 'todo', position: 0 }),
      makeStatus({ status: 'in_progress', position: 1 }),
    ])

    const { firstStatus } = useTaskGroups(ref([]), statuses)
    expect(firstStatus.value).toBe('todo')
  })

  it('firstStatus defaults to "todo" when no statuses', () => {
    const { firstStatus } = useTaskGroups(ref([]), ref(undefined))
    expect(firstStatus.value).toBe('todo')
  })

  it('excludes empty statuses not in the status list', () => {
    const tasks = ref([makeTask({ id: 't1', status: 'todo' })])
    const statuses = ref([makeStatus({ status: 'todo', position: 0 })])

    const { groupedTasks } = useTaskGroups(tasks, statuses)
    expect(groupedTasks.value).toHaveLength(1)
    expect(groupedTasks.value[0]!.status).toBe('todo')
  })
})
