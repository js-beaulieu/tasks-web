import { createResourceMutation } from '@/lib/createResourceMutation'
import { updateProjectMember, type MemberRole, type ProjectMember } from '@/api/members'
import { qk } from '@/lib/queryKeys'

export function useUpdateProjectMember() {
  return createResourceMutation<ProjectMember, { projectID: string; userID: string; role: MemberRole }>({
    mutationFn: ({ projectID, userID, role }) => updateProjectMember(projectID, userID, role),
    errorMessage: 'Could not update collaborator role',
    invalidate: (_, variables) => [qk.projectMembers(variables.projectID)],
  })
}