import { useQuery } from '@tanstack/vue-query'
import { listTags } from '@/api/tags'
import { qk } from '@/lib/queryKeys'

export function useTags() {
  return useQuery({
    queryKey: qk.tags(),
    queryFn: listTags,
  })
}
