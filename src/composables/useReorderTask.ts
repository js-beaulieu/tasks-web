import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateTask, type Task } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export interface ReorderTaskVariables {
  taskID: string
  position: number
  projectID: string
}

export function useReorderTask() {
  const queryClient = useQueryClient()

  return useMutation<Task, Error, ReorderTaskVariables>({
    mutationFn: ({ taskID, position }) => updateTask(taskID, { position }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID, 'tasks'] })
    },
    onError: (error) => {
      showErrorToast('Could not reorder task', error)
    },
  })
}