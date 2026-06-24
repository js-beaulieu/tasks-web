import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { deleteTask } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { taskID: string; projectID: string }>({
    mutationFn: ({ taskID }) => deleteTask(taskID),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not delete task', error)
    },
  })
}