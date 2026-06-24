import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { addTaskTag } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useAddTaskTag() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { taskID: string; tag: string }>({
    mutationFn: ({ taskID, tag }) => addTaskTag(taskID, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taskTags(variables.taskID) })
      queryClient.invalidateQueries({ queryKey: qk.tags() })
    },
    onError: (error) => {
      showErrorToast('Could not add tag', error)
    },
  })
}
