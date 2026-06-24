import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listProjectStatuses } from '@/api/statuses'
import { qk } from '@/lib/queryKeys'

export function useStatuses(projectID: MaybeRef<string>) {
  const id = computed(() => toValue(projectID))

  return useQuery({
    queryKey: computed(() => qk.projectStatuses(id.value)),
    queryFn: () => listProjectStatuses(id.value),
    enabled: computed(() => id.value.length > 0),
  })
}