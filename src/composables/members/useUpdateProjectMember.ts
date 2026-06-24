import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateProjectMember, type MemberRole, type ProjectMember } from '@/api/members'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useUpdateProjectMember() {
  const queryClient = useQueryClient()

  return useMutation<ProjectMember, Error, { projectID: string; userID: string; role: MemberRole }>({
    mutationFn: ({ projectID, userID, role }) => updateProjectMember(projectID, userID, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projectMembers(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not update collaborator role', error)
    },
  })
}
