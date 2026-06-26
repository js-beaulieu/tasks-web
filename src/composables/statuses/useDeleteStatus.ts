import { createResourceMutation } from '@/lib/createResourceMutation'
import { deleteProjectStatus } from '@/api/statuses'
import { qk } from '@/lib/queryKeys'

export function useDeleteStatus() {
  return createResourceMutation<void, { projectID: string; status: string }>({
    mutationFn: ({ projectID, status }) => deleteProjectStatus(projectID, status),
    errorMessage: 'Could not delete status',
    invalidate: (_, variables) => [qk.projectStatuses(variables.projectID)],
  })
}
