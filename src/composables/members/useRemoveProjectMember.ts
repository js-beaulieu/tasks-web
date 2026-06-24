import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { removeProjectMember } from '@/api/members'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation<{ reassigned: number }, Error, { projectID: string; userID: string }>({
    mutationFn: ({ projectID, userID }) => removeProjectMember(projectID, userID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projectMembers(variables.projectID) })
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
      queryClient.invalidateQueries({ queryKey: qk.tasks() })
    },
    onError: (error) => {
      showErrorToast('Could not remove collaborator', error)
    },
  })
}
