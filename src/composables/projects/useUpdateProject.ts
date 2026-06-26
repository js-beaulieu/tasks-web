import { createResourceMutation } from '@/lib/createResourceMutation'
import { updateProject, type Project, type UpdateProjectInput } from '@/api/projects'
import { qk } from '@/lib/queryKeys'

export function useUpdateProject() {
  return createResourceMutation<Project, { projectID: string; input: UpdateProjectInput }>({
    mutationFn: ({ projectID, input }) => updateProject(projectID, input),
    errorMessage: 'Could not update project',
    invalidate: (_, variables) => [qk.projects(), qk.project(variables.projectID)],
  })
}
