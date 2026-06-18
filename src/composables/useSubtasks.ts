import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listSubtasks } from '@/api/tasks'

export function useSubtasks(parentTaskID: MaybeRef<string | undefined>) {
  const id = computed(() => toValue(parentTaskID))

  return useQuery({
    queryKey: computed(() => ['tasks', id.value, 'subtasks']),
    queryFn: () => listSubtasks(id.value!),
    enabled: computed(() => !!id.value),
    placeholderData: (prev: import('@/api/tasks').Task[] | undefined) => prev ?? [],
  })
}
