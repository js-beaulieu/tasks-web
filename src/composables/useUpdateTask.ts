import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type UpdateTaskInput, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, { taskID: string; input: UpdateTaskInput }>({
    mutationFn: ({ taskID, input }) => updateTask(taskID, input),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', updated.projectId, 'tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID] })
    },
    onError: (error) => {
      showErrorToast('Could not update task', error)
    },
  })
}