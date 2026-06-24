import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

export type TaskSortMode = 'position' | 'dueDate'

export function useTaskSort() {
  const store = useUIStore()

  const sortMode = computed({
    get: () => store.sortMode,
    set: (v: TaskSortMode) => store.setSortMode(v),
  })

  const isManualOrder = computed(() => store.isManualOrder)

  return { sortMode, isManualOrder }
}