import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { updateTask, type UpdateTaskInput, type UpdateTaskResult } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskResult, Error, { taskID: string; input: UpdateTaskInput; sourceProjectID?: string }>({
    mutationFn: ({ taskID, input }) => updateTask(taskID, input),
    onSuccess: (data, variables) => {
      const updated = data.task
      const sourceProjectID = variables.sourceProjectID

      queryClient.invalidateQueries({ queryKey: qk.projectTasks(updated.projectId) })
      queryClient.invalidateQueries({ queryKey: qk.task(variables.taskID) })
      queryClient.invalidateQueries({ queryKey: qk.taskSubtasks(variables.taskID) })

      if (sourceProjectID) {
        queryClient.invalidateQueries({ queryKey: qk.project(sourceProjectID) })
        queryClient.invalidateQueries({ queryKey: qk.projectMembers(sourceProjectID) })
        queryClient.invalidateQueries({ queryKey: qk.projectStatuses(sourceProjectID) })
      }

      if (sourceProjectID && sourceProjectID !== updated.projectId) {
        queryClient.invalidateQueries({ queryKey: qk.projectTasks(sourceProjectID) })
      }

      queryClient.invalidateQueries({ queryKey: qk.project(updated.projectId) })
      queryClient.invalidateQueries({ queryKey: qk.projectMembers(updated.projectId) })
      queryClient.invalidateQueries({ queryKey: qk.projectStatuses(updated.projectId) })

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