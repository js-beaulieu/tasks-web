import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { updateProject, type Project, type UpdateProjectInput } from '@/api/projects'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, { projectID: string; input: UpdateProjectInput }>({
    mutationFn: ({ projectID, input }) => updateProject(projectID, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.projects() })
      queryClient.invalidateQueries({ queryKey: qk.project(variables.projectID) })
    },
    onError: (error) => {
      showErrorToast('Could not update project', error)
    },
  })
}
