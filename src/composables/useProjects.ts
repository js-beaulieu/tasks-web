import { useQuery } from '@tanstack/vue-query'
import { listProjects } from '@/api/projects'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })
}
