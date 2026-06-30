import { createResourceMutation } from '@/lib/createResourceMutation'
import { deleteProject } from '@/api/projects'
import { qk } from '@/lib/queryKeys'

export function useDeleteProject() {
  return createResourceMutation<void, string>({
    mutationFn: deleteProject,
    errorMessage: 'Could not delete project',
    invalidate: () => [qk.projects()],
    remove: (_, projectID) => [qk.project(projectID)],
  })
}
