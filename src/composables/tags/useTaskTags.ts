import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listTaskTags } from '@/api/tasks'

export function useTaskTags(taskID: MaybeRef<string | undefined>) {
  const id = computed(() => toValue(taskID))

  return useQuery({
    queryKey: computed(() => ['tasks', id.value, 'tags']),
    queryFn: () => listTaskTags(id.value!),
    enabled: computed(() => !!id.value),
    placeholderData: (prev: string[] | undefined) => prev ?? [],
  })
}
