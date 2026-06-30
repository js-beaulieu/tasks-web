import { ref, watch, type Ref } from 'vue'
import type { Task } from '@/api/tasks'

interface DraggableOptions {
  tasks: Ref<Task[]>
  dragResetKey?: Ref<number | undefined>
  readStatus: (el: HTMLElement) => string | null
}

export function useDraggableTasks(
  opts: DraggableOptions,
  emit: (e: 'reorder', taskID: string, newIndex: number, newStatus?: string) => void,
) {
  const localTasks = ref<Task[]>([])

  watch(
    [opts.tasks, () => opts.dragResetKey?.value],
    ([tasks]) => {
      localTasks.value = [...tasks]
    },
    { immediate: true },
  )

  let draggedTaskId: string | null = null

  function onStart(evt: { item: HTMLElement }) {
    document.body.classList.add('sortable-dragging')
    draggedTaskId = evt.item.dataset.taskId ?? evt.item.dataset.id ?? null
  }

  function onEnd(evt: { from: HTMLElement; to: HTMLElement; newIndex?: number }) {
    document.body.classList.remove('sortable-dragging')
    const fromStatus = opts.readStatus(evt.from)
    const toStatus = opts.readStatus(evt.to)
    if (
      fromStatus &&
      toStatus &&
      fromStatus === toStatus &&
      evt.newIndex != null &&
      draggedTaskId
    ) {
      emit('reorder', draggedTaskId, evt.newIndex)
    }
    if (fromStatus !== toStatus) {
      if (draggedTaskId) {
        localTasks.value = localTasks.value.filter((t) => t.id !== draggedTaskId)
      }
      draggedTaskId = null
      return
    }
    draggedTaskId = null
  }

  function onAdd(evt: {
    newIndex?: number
    newDraggableIndex?: number
    to: HTMLElement
    item?: HTMLElement
  }) {
    document.body.classList.remove('sortable-dragging')
    const toStatus = opts.readStatus(evt.to)
    const taskId = evt.item?.dataset?.taskId ?? evt.item?.dataset?.id ?? draggedTaskId
    if (!toStatus || !taskId) {
      localTasks.value = [...opts.tasks.value]
      draggedTaskId = null
      return
    }
    const idx = evt.newDraggableIndex ?? evt.newIndex ?? 0
    emit('reorder', taskId, idx, toStatus)
    draggedTaskId = null
  }

  return { localTasks, onStart, onEnd, onAdd }
}
