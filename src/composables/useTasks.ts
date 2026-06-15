import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listProjectTasks } from '@/api/tasks'

export function useTasks(
  projectID: MaybeRef<string>,
  filters?: MaybeRef<{ status?: string; assigneeId?: string; tag?: string }>,
) {
  const id = computed(() => toValue(projectID))
  const f = computed(() => toValue(filters))

  return useQuery({
    queryKey: computed(() => ['projects', id.value, 'tasks', f.value]),
    queryFn: () => listProjectTasks(id.value, f.value),
    enabled: computed(() => id.value.length > 0),
  })
}