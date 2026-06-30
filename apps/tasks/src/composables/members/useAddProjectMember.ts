import { createResourceMutation } from '@/lib/createResourceMutation'
import { addProjectMember, type AddMemberInput, type ProjectMember } from '@/api/members'
import { qk } from '@/lib/queryKeys'

export function useAddProjectMember() {
  return createResourceMutation<ProjectMember, { projectID: string; input: AddMemberInput }>({
    mutationFn: ({ projectID, input }) => addProjectMember(projectID, input),
    errorMessage: 'Could not add collaborator',
    invalidate: (_, variables) => [qk.projectMembers(variables.projectID)],
  })
}
