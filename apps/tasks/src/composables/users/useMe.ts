import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { getMe } from '@/api/users'
import { qk } from '@/lib/queryKeys'

export function useMe(enabled: MaybeRef<boolean> = true) {
  return useQuery({
    queryKey: qk.me(),
    queryFn: getMe,
    enabled,
  })
}
