import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createTask, type CreateTaskInput, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, { projectID: string; input: CreateTaskInput }>({
    mutationFn: ({ projectID, input }) => createTask(projectID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not create task', error)
    },
  })
}