import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createProject, type CreateProjectInput, type Project } from '@/api/projects'
import { showErrorToast } from '@/lib/error'
import { qk } from '@/lib/queryKeys'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.projects() })
    },
    onError: (error) => {
      showErrorToast('Could not create project', error)
    },
  })
}
