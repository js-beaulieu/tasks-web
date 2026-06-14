import { useQuery } from '@tanstack/vue-query'
import type { MaybeRef } from 'vue'
import { getMe } from '@/api/users'

export function useMe(enabled: MaybeRef<boolean> = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled,
  })
}
