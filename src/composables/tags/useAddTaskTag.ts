import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { addTaskTag } from '@/api/tasks'
import { showErrorToast } from '@/lib/error'

export function useAddTaskTag() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { taskID: string; tag: string }>({
    mutationFn: ({ taskID, tag }) => addTaskTag(taskID, tag),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskID, 'tags'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: (error) => {
      showErrorToast('Could not add tag', error)
    },
  })
}
