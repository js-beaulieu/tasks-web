import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useTaskFilters } from './useTaskFilters'
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

describe('useTaskFilters', () => {
  const tasksA = makeTask({ id: 't1', status: 'todo', position: 0 })
  const tasksB = makeTask({ id: 't2', status: 'todo', position: 1 })

  it('returns all tasks when no tags are selected', () => {
    const tasks = ref([tasksA, tasksB])
    const tagsByTask = ref<Record<string, string[]>>({})
    const { filteredTasks } = useTaskFilters(tasks, tagsByTask, ref('position'), ref(true))

    expect(filteredTasks.value).toHaveLength(2)
  })

  it('availableTags collects unique tags sorted alphabetically', () => {
    const tasks = ref([tasksA, tasksB])
    const tagsByTask = ref<Record<string, string[]>>({
      t1: ['urgent', 'backend'],
      t2: ['backend', 'frontend'],
    })
    const { availableTags } = useTaskFilters(tasks, tagsByTask, ref('position'), ref(true))

    expect(availableTags.value).toEqual(['backend', 'frontend', 'urgent'])
  })

  it('hasActiveFilters is false when no tags selected', () => {
    const { hasActiveFilters } = useTaskFilters(ref([]), ref({}), ref('position'), ref(true))
    expect(hasActiveFilters.value).toBe(false)
  })

  it('hasActiveFilters is true when tags are selected', async () => {
    const { selectedTags, hasActiveFilters } = useTaskFilters(
      ref([]),
      ref({}),
      ref('position'),
      ref(true),
    )
    selectedTags.value = ['urgent']
    await nextTick()
    expect(hasActiveFilters.value).toBe(true)
  })

  it('filters tasks by selected tags (AND filter)', () => {
    const tasks = ref([makeTask({ id: 't1' }), makeTask({ id: 't2' })])
    const tagsByTask = ref<Record<string, string[]>>({
      t1: ['urgent', 'backend'],
      t2: ['backend'],
    })
    const { selectedTags, filteredTasks } = useTaskFilters(
      tasks,
      tagsByTask,
      ref('position'),
      ref(true),
    )

    selectedTags.value = ['urgent']
    expect(filteredTasks.value).toHaveLength(1)
    expect(filteredTasks.value[0]!.id).toBe('t1')
  })

  it('filters tasks by multiple tags (AND semantics)', () => {
    const tasks = ref([makeTask({ id: 't1' }), makeTask({ id: 't2' })])
    const tagsByTask = ref<Record<string, string[]>>({
      t1: ['urgent', 'backend'],
      t2: ['backend'],
    })
    const { selectedTags, filteredTasks } = useTaskFilters(
      tasks,
      tagsByTask,
      ref('position'),
      ref(true),
    )

    selectedTags.value = ['urgent', 'backend']
    expect(filteredTasks.value).toHaveLength(1)
    expect(filteredTasks.value[0]!.id).toBe('t1')
  })

  it('returns tasks in original order when manual sort', () => {
    const tasks = ref([makeTask({ id: 't2', position: 1 }), makeTask({ id: 't1', position: 0 })])
    const { sortedTasks } = useTaskFilters(tasks, ref({}), ref('position'), ref(true))

    expect(sortedTasks.value[0]!.id).toBe('t2')
    expect(sortedTasks.value[1]!.id).toBe('t1')
  })

  it('sorts overdue tasks first when dueDate sort', () => {
    const tasks = ref([
      makeTask({ id: 't1', dueDate: '2099-01-01T00:00:00Z', status: 'todo' }),
      makeTask({ id: 't2', dueDate: '2000-01-01T00:00:00Z', status: 'todo' }),
    ])
    const { sortedTasks } = useTaskFilters(tasks, ref({}), ref('dueDate'), ref(false))

    expect(sortedTasks.value[0]!.id).toBe('t2')
    expect(sortedTasks.value[1]!.id).toBe('t1')
  })

  it('sorts tasks without due date last when dueDate sort', () => {
    const tasks = ref([
      makeTask({ id: 't1', dueDate: null, status: 'todo' }),
      makeTask({ id: 't2', dueDate: '2026-06-15T00:00:00Z', status: 'todo' }),
    ])
    const { sortedTasks } = useTaskFilters(tasks, ref({}), ref('dueDate'), ref(false))

    expect(sortedTasks.value[0]!.id).toBe('t2')
    expect(sortedTasks.value[1]!.id).toBe('t1')
  })

  it('handles undefined tasks gracefully', () => {
    const tasks = ref<Task[] | undefined>(undefined)
    const { filteredTasks, sortedTasks } = useTaskFilters(
      tasks,
      ref({}),
      ref('position'),
      ref(true),
    )

    expect(filteredTasks.value).toEqual([])
    expect(sortedTasks.value).toEqual([])
  })
})
