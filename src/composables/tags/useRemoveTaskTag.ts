import { createResourceMutation } from '@/lib/createResourceMutation'
import { removeTaskTag } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useRemoveTaskTag() {
  return createResourceMutation<void, { taskID: string; tag: string }>({
    mutationFn: ({ taskID, tag }) => removeTaskTag(taskID, tag),
    errorMessage: 'Could not remove tag',
    invalidate: (_, variables) => [qk.taskTags(variables.taskID)],
  })
}
