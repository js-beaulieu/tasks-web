import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

export type TaskViewMode = 'vertical' | 'board'

const STORAGE_KEY = 'tasks-web-task-view'

export function useTaskViewPreference() {
  const stored = useStorage<TaskViewMode>(STORAGE_KEY, 'vertical')

  const view = computed({
    get: () => stored.value,
    set: (v: TaskViewMode) => {
      stored.value = v
    },
  })

  return { view }
}