import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listProjectMembers } from '@/api/members'

export function useMembers(projectID: MaybeRef<string>) {
  const id = computed(() => toValue(projectID))

  return useQuery({
    queryKey: computed(() => ['projects', id.value, 'members']),
    queryFn: () => listProjectMembers(id.value),
    enabled: computed(() => id.value.length > 0),
  })
}
