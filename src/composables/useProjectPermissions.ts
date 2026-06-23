import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import type { Project } from '@/api/projects'

export function useProjectPermissions(project: MaybeRef<Project | undefined>) {
  const role = computed(() => toValue(project)?.effectiveRole ?? null)

  return {
    role,
    canRead: computed(() => role.value !== null),
    canModify: computed(() => role.value === 'modify' || role.value === 'admin'),
    canAdmin: computed(() => role.value === 'admin'),
  }
}