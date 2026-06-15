import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import type { Project } from '@/api/projects'
import type { ProjectMember } from '@/api/members'

export type Role = 'read' | 'modify' | 'admin'

export function resolveEffectiveRole(
  currentUserID: string,
  project: Project,
  members: ProjectMember[],
): Role {
  if (project.ownerId === currentUserID) return 'admin'

  const membership = members.find((m) => m.userId === currentUserID)
  if (membership) return membership.role

  return 'read'
}

export function canModify(role: Role): boolean {
  return role === 'modify' || role === 'admin'
}

export function isAdmin(role: Role): boolean {
  return role === 'admin'
}

export function useEffectiveRole(
  currentUserID: MaybeRef<string | undefined>,
  project: MaybeRef<Project | undefined>,
  members: MaybeRef<ProjectMember[] | undefined>,
) {
  const role = computed<Role | null>(() => {
    const uid = toValue(currentUserID)
    const proj = toValue(project)
    const mems = toValue(members)
    if (!uid || !proj || !mems) return null
    return resolveEffectiveRole(uid, proj, mems)
  })

  return {
    role,
    canModify: computed(() => role.value !== null && canModify(role.value)),
    isAdmin: computed(() => role.value === 'admin'),
  }
}