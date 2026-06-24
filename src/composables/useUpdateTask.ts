import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { updateTask, type UpdateTaskInput, type UpdateTaskResult } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskResult, Error, { taskID: string; input: UpdateTaskInput; sourceProjectID?: string }>({
    mutationFn: ({ taskID, input }) => updateTask(taskID, input),
    onSuccess: (data, variables) => {
      const updated = data.task
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

      if (data.nextOccurrenceId) {
        toast.success('Task completed', {
          description: 'Next occurrence created.',
        })
      }
    },
    onError: (error) => {
      showErrorToast('Could not update task', error)
    },
  })
}