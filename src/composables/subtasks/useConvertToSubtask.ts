import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type UpdateTaskResult } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useConvertToSubtask() {
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskResult, Error, { taskID: string; parentTaskID: string; projectID: string; oldParentID?: string | null }>({
    mutationFn: ({ taskID, parentTaskID }) => updateTask(taskID, { parentId: parentTaskID }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.task(variables.taskID) })
      queryClient.invalidateQueries({ queryKey: qk.taskSubtasks(variables.parentTaskID) })
      queryClient.invalidateQueries({ queryKey: qk.projectTasks(variables.projectID) })
      if (variables.oldParentID) {
        queryClient.invalidateQueries({ queryKey: qk.taskSubtasks(variables.oldParentID) })
      }
    },
    onError: (error) => {
      showErrorToast('Could not convert to subtask', error)
    },
  })
}
