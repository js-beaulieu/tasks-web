import { createResourceMutation } from '@/lib/createResourceMutation'
import { createSubtask, type CreateTaskInput, type Task } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useCreateSubtask() {
  return createResourceMutation<
    Task,
    { parentTaskID: string; projectID: string; input: CreateTaskInput }
  >({
    mutationFn: ({ parentTaskID, input }) => createSubtask(parentTaskID, input),
    errorMessage: 'Could not create subtask',
    invalidate: (_, variables) => [
      qk.taskSubtasks(variables.parentTaskID),
      qk.projectTasks(variables.projectID),
    ],
  })
}
