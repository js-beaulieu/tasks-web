import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type UpdateTaskResult } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useDetachSubtask() {
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskResult, Error, { taskID: string; projectID: string; parentTaskID: string }>({
    mutationFn: ({ taskID }) => updateTask(taskID, { parentId: null }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.task(variables.taskID) })
      queryClient.invalidateQueries({ queryKey: qk.taskSubtasks(variables.parentTaskID) })
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not detach subtask', error)
    },
  })
}
