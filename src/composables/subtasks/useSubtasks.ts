import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listSubtasks } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useSubtasks(parentTaskID: MaybeRef<string | undefined>) {
  const id = computed(() => toValue(parentTaskID))

  return useQuery({
    queryKey: computed(() => qk.taskSubtasks(id.value)),
    queryFn: () => listSubtasks(id.value!),
    enabled: computed(() => !!id.value),
    placeholderData: (prev: import('@/api/tasks').Task[] | undefined) => prev ?? [],
  })
}
