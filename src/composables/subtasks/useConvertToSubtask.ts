import { createResourceMutation } from '@/lib/createResourceMutation'
import { updateTask, type UpdateTaskResult } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useConvertToSubtask() {
  return createResourceMutation<
    UpdateTaskResult,
    { taskID: string; parentTaskID: string; projectID: string; oldParentID?: string | null }
  >({
    mutationFn: ({ taskID, parentTaskID }) => updateTask(taskID, { parentId: parentTaskID }),
    errorMessage: 'Could not convert to subtask',
    invalidate: (_, variables) => {
      const keys = [
        qk.task(variables.taskID),
        qk.taskSubtasks(variables.parentTaskID),
        qk.projectTasks(variables.projectID),
      ]
      if (variables.oldParentID) {
        keys.push(qk.taskSubtasks(variables.oldParentID))
      }
      return keys
    },
  })
}