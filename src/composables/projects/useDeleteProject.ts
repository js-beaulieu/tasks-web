import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { deleteProject } from '@/api/projects'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: (_, projectID) => {
      queryClient.invalidateQueries({ queryKey: qk.projects() })
      queryClient.removeQueries({ queryKey: qk.project(projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not delete project', error)
    },
  })
}
