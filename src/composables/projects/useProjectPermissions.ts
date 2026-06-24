import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import type { Project } from '@/api/projects'

export function canModifyRole(role: string | undefined | null): boolean {
  return role === 'modify' || role === 'admin'
}

export function canAdminRole(role: string | undefined | null): boolean {
  return role === 'admin'
}

export function useProjectPermissions(project: MaybeRef<Project | undefined>) {
  const role = computed(() => toValue(project)?.effectiveRole ?? null)

  return {
    role,
    canRead: computed(() => role.value !== null),
    canModify: computed(() => canModifyRole(role.value)),
    canAdmin: computed(() => canAdminRole(role.value)),
  }
}