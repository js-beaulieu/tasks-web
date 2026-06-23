import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type UpdateTaskInput, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, { taskID: string; input: UpdateTaskInput; sourceProjectID?: string }>({
    mutationFn: ({ taskID, input }) => updateTask(taskID, input),
    onSuccess: (updated, variables) => {
      const sourceProjectID = variables.sourceProjectID

      queryClient.invalidateQueries({ queryKey: ['projects', updated.projectId, 'tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID, 'subtasks'] })

      if (sourceProjectID) {
        queryClient.invalidateQueries({ queryKey: ['projects', sourceProjectID] })
        queryClient.invalidateQueries({ queryKey: ['projects', sourceProjectID, 'members'] })
        queryClient.invalidateQueries({ queryKey: ['projects', sourceProjectID, 'statuses'] })
      }

      if (sourceProjectID && sourceProjectID !== updated.projectId) {
        queryClient.invalidateQueries({ queryKey: ['projects', sourceProjectID, 'tasks'] })
      }

      queryClient.invalidateQueries({ queryKey: ['projects', updated.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects', updated.projectId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['projects', updated.projectId, 'statuses'] })
    },
    onError: (error) => {
      showErrorToast('Could not update task', error)
    },
  })
}
