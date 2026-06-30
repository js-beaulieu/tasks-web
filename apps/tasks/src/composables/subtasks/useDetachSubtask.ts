import { createResourceMutation } from '@/lib/createResourceMutation'
import { updateTask, type UpdateTaskResult } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useDetachSubtask() {
  return createResourceMutation<
    UpdateTaskResult,
    { taskID: string; projectID: string; parentTaskID: string }
  >({
    mutationFn: ({ taskID }) => updateTask(taskID, { parentId: null }),
    errorMessage: 'Could not detach subtask',
    invalidate: (_, variables) => [
      qk.task(variables.taskID),
      qk.taskSubtasks(variables.parentTaskID),
      qk.projectTasks(variables.projectID),
    ],
  })
}
