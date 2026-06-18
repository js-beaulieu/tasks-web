import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useConvertToSubtask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, { taskID: string; parentTaskID: string; projectID: string; oldParentID?: string | null }>({
    mutationFn: ({ taskID, parentTaskID }) => updateTask(taskID, { parentId: parentTaskID }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.parentTaskID, 'subtasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
      if (variables.oldParentID) {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.oldParentID, 'subtasks'] })
      }
    },
    onError: (error) => {
      showErrorToast('Could not convert to subtask', error)
    },
  })
}
