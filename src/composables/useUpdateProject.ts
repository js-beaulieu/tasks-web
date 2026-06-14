import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateProject, type Project, type UpdateProjectInput } from '@/api/projects'
import { showErrorToast } from '@/lib/error'

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, { projectID: string; input: UpdateProjectInput }>({
    mutationFn: ({ projectID, input }) => updateProject(projectID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectID] })
    },
    onError: (error) => {
      showErrorToast('Could not update project', error)
    },
  })
}
