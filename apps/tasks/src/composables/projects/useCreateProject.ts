import { createResourceMutation } from '@/lib/createResourceMutation'
import { createProject, type CreateProjectInput, type Project } from '@/api/projects'
import { qk } from '@/lib/queryKeys'

export function useCreateProject() {
  return createResourceMutation<Project, CreateProjectInput>({
    mutationFn: createProject,
    errorMessage: 'Could not create project',
    invalidate: () => [qk.projects()],
  })
}
