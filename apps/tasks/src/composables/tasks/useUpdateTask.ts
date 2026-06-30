import { createResourceMutation } from '@/lib/createResourceMutation'
import { toast } from 'vue-sonner'
import { updateTask, type UpdateTaskInput, type UpdateTaskResult } from '@/api/tasks'
import { qk } from '@/lib/queryKeys'

export function useUpdateTask() {
  return createResourceMutation<
    UpdateTaskResult,
    { taskID: string; input: UpdateTaskInput; sourceProjectID?: string }
  >({
    mutationFn: ({ taskID, input }) => updateTask(taskID, input),
    errorMessage: 'Could not update task',
    onSuccess: (data, variables, queryClient) => {
      const updated = data.task
      const sourceProjectID = variables.sourceProjectID

      queryClient.invalidateQueries({ queryKey: [...qk.projectTasks(updated.projectId)] })
      queryClient.invalidateQueries({ queryKey: [...qk.task(variables.taskID)] })
      queryClient.invalidateQueries({ queryKey: [...qk.taskSubtasks(variables.taskID)] })

      if (sourceProjectID) {
        queryClient.invalidateQueries({ queryKey: [...qk.project(sourceProjectID)] })
        queryClient.invalidateQueries({ queryKey: [...qk.projectMembers(sourceProjectID)] })
        queryClient.invalidateQueries({ queryKey: [...qk.projectStatuses(sourceProjectID)] })
      }

      if (sourceProjectID && sourceProjectID !== updated.projectId) {
        queryClient.invalidateQueries({ queryKey: [...qk.projectTasks(sourceProjectID)] })
      }

      queryClient.invalidateQueries({ queryKey: [...qk.project(updated.projectId)] })
      queryClient.invalidateQueries({ queryKey: [...qk.projectMembers(updated.projectId)] })
      queryClient.invalidateQueries({ queryKey: [...qk.projectStatuses(updated.projectId)] })

      if (data.nextOccurrenceId) {
        toast.success('Task completed', {
          description: 'Next occurrence created.',
        })
      }
    },
  })
}
