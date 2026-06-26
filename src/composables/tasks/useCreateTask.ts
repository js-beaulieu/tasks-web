import { createResourceMutation } from '@/lib/createResourceMutation'
import { createTask, type CreateTaskInput, type Task } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useCreateTask() {
  return createResourceMutation<Task, { projectID: string; input: CreateTaskInput }>({
    mutationFn: ({ projectID, input }) => createTask(projectID, input),
    errorMessage: 'Could not create task',
    invalidate: (_, variables) => [qk.projectTasks(variables.projectID)],
  })
}
