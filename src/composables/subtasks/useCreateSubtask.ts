import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createSubtask, type CreateTaskInput, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useCreateSubtask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, { parentTaskID: string; projectID: string; input: CreateTaskInput }>({
    mutationFn: ({ parentTaskID, input }) => createSubtask(parentTaskID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taskSubtasks(variables.parentTaskID) })
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not create subtask', error)
    },
  })
}
