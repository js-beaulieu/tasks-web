import { createResourceMutation } from '@/lib/createResourceMutation'
import { addTaskTag } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useAddTaskTag() {
  return createResourceMutation<void, { taskID: string; tag: string }>({
    mutationFn: ({ taskID, tag }) => addTaskTag(taskID, tag),
    errorMessage: 'Could not add tag',
    invalidate: (_, variables) => [qk.taskTags(variables.taskID), qk.tags()],
  })
}
