import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

export type TaskSortMode = 'position' | 'dueDate'

const STORAGE_KEY = 'tasks-web-task-sort'

export function useTaskSort() {
  const stored = useStorage<TaskSortMode>(STORAGE_KEY, 'position')

  const sortMode = computed({
    get: () => stored.value,
    set: (v: TaskSortMode) => {
      stored.value = v
    },
  })

  const isManualOrder = computed(() => sortMode.value === 'position')

  return { sortMode, isManualOrder }
}