import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { searchUsers } from '@/api/users'
import { qk } from '@/lib/queryKeys'

export function useUserSearch(
  query: MaybeRef<string>,
  limit: MaybeRef<number> = 20,
) {
  const normalizedQuery = computed(() => toValue(query).trim())
  const normalizedLimit = computed(() => toValue(limit))

  return useQuery({
    queryKey: computed(() => qk.userSearch(normalizedQuery.value, normalizedLimit.value)),
    queryFn: () => searchUsers(normalizedQuery.value, normalizedLimit.value),
    enabled: computed(() => normalizedQuery.value.length >= 2),
    placeholderData: (prev: import('@/api/users').User[] | undefined) => prev ?? [],
  })
}
