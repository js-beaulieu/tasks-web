import { useQuery } from '@tanstack/vue-query'
import { listTags } from '@/api/tags'

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: listTags,
  })
}