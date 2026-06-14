import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { getProject } from '@/api/projects'

export function useProject(projectID: MaybeRef<string>) {
  const id = computed(() => toValue(projectID))

  return useQuery({
    queryKey: computed(() => ['projects', id.value]),
    queryFn: () => getProject(id.value),
    enabled: computed(() => id.value.length > 0),
  })
}
