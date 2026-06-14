import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { deleteProject } from '@/api/projects'
import { showErrorToast } from '@/lib/error'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: (_, projectID) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.removeQueries({ queryKey: ['projects', projectID] })
    },
    onError: (error) => {
      showErrorToast('Could not delete project', error)
    },
  })
}
