import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createProjectStatus, type ProjectStatus } from '@/api/statuses'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useCreateStatus() {
  const queryClient = useQueryClient()

  return useMutation<ProjectStatus, Error, { projectID: string; status: string }>({
    mutationFn: ({ projectID, status }) => createProjectStatus(projectID, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projectStatuses(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not create status', error)
    },
  })
}