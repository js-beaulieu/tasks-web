import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export type TaskViewMode = 'vertical' | 'board'

export function useTaskViewPreference() {
  const store = useUIStore()

  const view = computed({
    get: () => store.viewMode,
    set: (v: TaskViewMode) => store.setViewMode(v),
  })

  return { view }
}
