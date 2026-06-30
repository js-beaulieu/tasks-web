import { createResourceMutation } from '@/lib/createResourceMutation'
import { removeProjectMember } from '@/api/members'
import { qk } from '@/lib/queryKeys'

export function useRemoveProjectMember() {
  return createResourceMutation<{ reassigned: number }, { projectID: string; userID: string }>({
    mutationFn: ({ projectID, userID }) => removeProjectMember(projectID, userID),
    errorMessage: 'Could not remove collaborator',
    invalidate: (_, variables) => [
      qk.projectMembers(variables.projectID),
      qk.projectTasks(variables.projectID),
      qk.tasks(),
    ],
  })
}
