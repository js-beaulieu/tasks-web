import { useQuery } from '@tanstack/vue-query'
import { keyBy, uniq } from 'es-toolkit'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { getUsersByIDs, type User } from '@/api/users'

export type UsersByIDMap = Record<string, User>

export function useUsersByID(userIDs: MaybeRef<string[]>) {
  const normalized = computed(() => {
    const ids = toValue(userIDs)
    const deduped = uniq(ids)
    deduped.sort()
    return deduped
  })

  return useQuery({
    queryKey: computed(() => ['users', 'by-id', normalized.value]),
    queryFn: async (): Promise<UsersByIDMap> => {
      const users = await getUsersByIDs(normalized.value)
      return keyBy(users, (user) => user.id)
    },
    enabled: computed(() => normalized.value.length > 0),
    initialData: {} as UsersByIDMap,
  })
}
