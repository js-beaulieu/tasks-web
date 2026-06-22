import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { removeProjectMember } from '@/api/members'
import { showErrorToast } from '@/lib/error'

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation<{ reassigned: number }, Error, { projectID: string; userID: string }>({
    mutationFn: ({ projectID, userID }) => removeProjectMember(projectID, userID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      showErrorToast('Could not remove collaborator', error)
    },
  })
}
