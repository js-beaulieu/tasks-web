import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { completeTask, type CompleteTaskResponse } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useCompleteTask() {
  const queryClient = useQueryClient()

  return useMutation<
    CompleteTaskResponse,
    Error,
    { taskID: string; doneStatus: string; projectID: string }
  >({
    mutationFn: ({ taskID, doneStatus }) => completeTask(taskID, doneStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
    },
    onError: (error) => {
      showErrorToast('Could not complete task', error)
    },
  })
}