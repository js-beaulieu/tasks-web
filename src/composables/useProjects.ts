import { useQuery } from '@tanstack/vue-query'
import { listProjects } from '@/api/projects'
import { qk } from '@/lib/queryKeys'

export function useProjects() {
  return useQuery({
    queryKey: qk.projects(),
    queryFn: listProjects,
  })
}
