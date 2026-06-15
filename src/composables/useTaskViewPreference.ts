import { useStorage, useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

export type TaskViewMode = 'vertical' | 'board'

const STORAGE_KEY = 'tasks-web-task-view'

export function useTaskViewPreference() {
  const stored = useStorage<TaskViewMode>(STORAGE_KEY, null as unknown as TaskViewMode)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const defaultView = computed(() => (isDesktop.value ? 'board' : 'vertical') as TaskViewMode)

  const view = computed({
    get: () => (stored.value as TaskViewMode | null) ?? defaultView.value,
    set: (v: TaskViewMode) => {
      stored.value = v
    },
  })

  return { view }
}