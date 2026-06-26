import { createResourceMutation } from '@/lib/createResourceMutation'
import { deleteTask } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useDeleteTask() {
  return createResourceMutation<void, { taskID: string; projectID: string }>({
    mutationFn: ({ taskID }) => deleteTask(taskID),
    errorMessage: 'Could not delete task',
    invalidate: (_, variables) => [qk.projectTasks(variables.projectID)],
  })
}
