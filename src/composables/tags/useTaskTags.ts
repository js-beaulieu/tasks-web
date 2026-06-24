import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listTaskTags } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useTaskTags(taskID: MaybeRef<string | undefined>) {
  const id = computed(() => toValue(taskID))

  return useQuery({
    queryKey: computed(() => qk.taskTags(id.value)),
    queryFn: () => listTaskTags(id.value!),
    enabled: computed(() => !!id.value),
    placeholderData: (prev: string[] | undefined) => prev ?? [],
  })
}
