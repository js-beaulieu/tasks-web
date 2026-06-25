import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/users/useUsersByID'

export interface ProjectContext {
  projectID: ComputedRef<string>
  statuses: ComputedRef<ProjectStatus[]>
  usersByID: ComputedRef<UsersByIDMap | undefined>
  canModify: ComputedRef<boolean>
}

export const ProjectContextKey: InjectionKey<ProjectContext> = Symbol('ProjectContext')

export function provideProjectContext(ctx: ProjectContext) {
  provide(ProjectContextKey, ctx)
}

export function useProjectContext(): ProjectContext | undefined {
  return inject(ProjectContextKey, undefined)
}