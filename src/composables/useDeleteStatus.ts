import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { deleteProjectStatus } from '@/api/statuses'
import { showErrorToast } from '@/lib/error'

export function useDeleteStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { projectID: string; status: string }>({
    mutationFn: ({ projectID, status }) => deleteProjectStatus(projectID, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'statuses'] })
    },
    onError: (error) => {
      showErrorToast('Could not delete status', error)
    },
  })
}