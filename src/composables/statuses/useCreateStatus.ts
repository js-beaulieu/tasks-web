import { createResourceMutation } from '@/lib/createResourceMutation'
import { createProjectStatus, type ProjectStatus } from '@/api/statuses'
import { qk } from '@/lib/queryKeys'

export function useCreateStatus() {
  return createResourceMutation<ProjectStatus, { projectID: string; status: string }>({
    mutationFn: ({ projectID, status }) => createProjectStatus(projectID, status),
    errorMessage: 'Could not create status',
    invalidate: (_, variables) => [qk.projectStatuses(variables.projectID)],
  })
}