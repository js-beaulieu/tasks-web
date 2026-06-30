import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listProjectTasks } from '@/api/tasks'
import { qk, type TaskFilters } from '@/lib/queryKeys'

export function useTasks(projectID: MaybeRef<string>, filters?: MaybeRef<TaskFilters>) {
  const id = computed(() => toValue(projectID))
  const f = computed(() => toValue(filters))

  return useQuery({
    queryKey: computed(() => qk.projectTasks(id.value, f.value)),
    queryFn: () => listProjectTasks(id.value, f.value),
    enabled: computed(() => id.value.length > 0),
  })
}
