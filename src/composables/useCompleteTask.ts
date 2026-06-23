import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
      if (data.next) {
        toast.success('Task completed', {
          description: 'Next occurrence created.',
        })
      }
    },
    onError: (error) => {
      showErrorToast('Could not complete task', error)
    },
  })
}