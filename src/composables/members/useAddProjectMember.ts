import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { addProjectMember, type AddMemberInput, type ProjectMember } from '@/api/members'
import { showErrorToast } from '@/lib/error'

export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation<ProjectMember, Error, { projectID: string; input: AddMemberInput }>({
    mutationFn: ({ projectID, input }) => addProjectMember(projectID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'members'] })
    },
    onError: (error) => {
      showErrorToast('Could not add collaborator', error)
    },
  })
}
