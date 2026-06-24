import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { removeTaskTag } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useRemoveTaskTag() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { taskID: string; tag: string }>({
    mutationFn: ({ taskID, tag }) => removeTaskTag(taskID, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.taskTags(variables.taskID) })
    },
    onError: (error) => {
      showErrorToast('Could not remove tag', error)
    },
  })
}
