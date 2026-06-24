import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type UpdateTaskResult } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useDetachSubtask() {
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskResult, Error, { taskID: string; projectID: string; parentTaskID: string }>({
    mutationFn: ({ taskID }) => updateTask(taskID, { parentId: null }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.parentTaskID, 'subtasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
    },
    onError: (error) => {
      showErrorToast('Could not detach subtask', error)
    },
  })
}
