import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { getTask } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useTask(taskID: MaybeRef<string | undefined>) {
  const id = computed(() => toValue(taskID))

  return useQuery({
    queryKey: computed(() => qk.task(id.value)),
    queryFn: () => getTask(id.value!),
    enabled: computed(() => !!id.value),
  })
}
