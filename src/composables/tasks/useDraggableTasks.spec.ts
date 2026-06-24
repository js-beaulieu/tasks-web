import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDraggableTasks } from './useDraggableTasks'
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

function makeEl(dataset: Record<string, string> = {}, statusAttr?: string): HTMLElement {
  const el = document.createElement('div')
  for (const [k, v] of Object.entries(dataset)) {
    el.dataset[k] = v
  }
  if (statusAttr) {
    el.setAttribute('data-status', statusAttr)
  }
  return el
}

const readStatusFromAttr = (el: HTMLElement) => el.getAttribute('data-status')
const readStatusFromClosest = (el: HTMLElement) =>
  el.closest('[data-status]')?.getAttribute('data-status') ?? null

describe('useDraggableTasks', () => {
  const tasksA = makeTask({ id: 't1', status: 'todo' })
  const tasksB = makeTask({ id: 't2', status: 'todo' })
  const initialTasks = [tasksA, tasksB]

  it('initializes localTasks from the provided tasks ref', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { localTasks } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    expect(localTasks.value).toEqual(initialTasks)
    expect(localTasks.value).not.toBe(initialTasks)
  })

  it('resets localTasks when dragResetKey changes', async () => {
    const tasks = ref(initialTasks)
    const dragResetKey = ref(0)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { localTasks } = useDraggableTasks(
      { tasks, dragResetKey, readStatus: readStatusFromAttr },
      emit,
    )

    const newTasks = [makeTask({ id: 't3', status: 'todo' })]
    tasks.value = newTasks
    dragResetKey.value = 1
    await nextTick()

    expect(localTasks.value).toEqual(newTasks)
  })

  it('onStart adds sortable-dragging class and tracks dragged task ID', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onStart } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    document.body.classList.remove('sortable-dragging')
    const item = makeEl({ taskId: 't1' })
    onStart({ item })

    expect(document.body.classList.contains('sortable-dragging')).toBe(true)
  })

  it('onEnd removes sortable-dragging class', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onEnd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    document.body.classList.add('sortable-dragging')
    onEnd({ from: makeEl({}, 'todo'), to: makeEl({}, 'todo'), newIndex: 1 })

    expect(document.body.classList.contains('sortable-dragging')).toBe(false)
  })

  it('onEnd emits reorder for same-status reorder', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onStart, onEnd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const item = makeEl({ taskId: 't1' })
    onStart({ item })
    onEnd({ from: makeEl({}, 'todo'), to: makeEl({}, 'todo'), newIndex: 2 })

    expect(emit).toHaveBeenCalledWith('reorder', 't1', 2)
  })

  it('onEnd removes dragged task from localTasks on cross-status move', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onStart, onEnd, localTasks } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const item = makeEl({ taskId: 't1' })
    onStart({ item })
    onEnd({ from: makeEl({}, 'todo'), to: makeEl({}, 'done') })

    expect(localTasks.value.find((t) => t.id === 't1')).toBeUndefined()
    expect(emit).not.toHaveBeenCalled()
  })

  it('onAdd emits reorder with target status for cross-status drop', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onAdd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const toEl = makeEl({}, 'in_progress')
    const item = makeEl({ taskId: 't1' })
    onAdd({ to: toEl, item, newDraggableIndex: 0 })

    expect(emit).toHaveBeenCalledWith('reorder', 't1', 0, 'in_progress')
  })

  it('onAdd falls back to newIndex when newDraggableIndex is missing', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onAdd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const toEl = makeEl({}, 'done')
    const item = makeEl({ taskId: 't1' })
    onAdd({ to: toEl, item, newIndex: 1 })

    expect(emit).toHaveBeenCalledWith('reorder', 't1', 1, 'done')
  })

  it('onAdd resets localTasks when status cannot be read', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onAdd, localTasks } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const toEl = makeEl()
    onAdd({ to: toEl })

    expect(localTasks.value).toEqual(initialTasks)
    expect(emit).not.toHaveBeenCalled()
  })

  it('onAdd uses dataset.id when dataset.taskId is missing', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onAdd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromAttr },
      emit,
    )

    const toEl = makeEl({}, 'todo')
    const item = makeEl({ id: 'fallback-id' })
    onAdd({ to: toEl, item, newDraggableIndex: 0 })

    expect(emit).toHaveBeenCalledWith('reorder', 'fallback-id', 0, 'todo')
  })

  it('works with readStatusFromClosest strategy (TaskGroup pattern)', () => {
    const tasks = ref(initialTasks)
    const emit = vi.fn<(e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void>()
    const { onStart, onEnd } = useDraggableTasks(
      { tasks, readStatus: readStatusFromClosest },
      emit,
    )

    const wrapper = makeEl({}, 'todo')
    const fromEl = document.createElement('div')
    const toEl = document.createElement('div')
    wrapper.appendChild(fromEl)
    wrapper.appendChild(toEl)

    const item = makeEl({ taskId: 't1' })
    onStart({ item })

    fromEl.closest = vi.fn<(s: string) => Element | null>().mockReturnValue(wrapper)
    toEl.closest = vi.fn<(s: string) => Element | null>().mockReturnValue(wrapper)
    onEnd({ from: fromEl, to: toEl, newIndex: 1 })

    expect(emit).toHaveBeenCalledWith('reorder', 't1', 1)
  })
})