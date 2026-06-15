import { describe, it, expect } from 'vitest'
import { resolveEffectiveRole, canModify, isAdmin } from './useEffectiveRole'
import type { Role } from './useEffectiveRole'
import type { Project } from '@/api/projects'
import type { ProjectMember } from '@/api/members'

const makeProject = (ownerId: string): Project => ({
  id: 'p1',
  name: 'Test',
  ownerId,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const makeMember = (userId: string, role: 'read' | 'modify' | 'admin'): ProjectMember => ({
  projectId: 'p1',
  userId,
  role,
})

describe('resolveEffectiveRole', () => {
  it('returns admin when current user is the project owner', () => {
    expect(resolveEffectiveRole('u1', makeProject('u1'), [])).toBe('admin')
  })

  it('returns admin when current user is the project owner even if not in members list', () => {
    expect(resolveEffectiveRole('u1', makeProject('u1'), [makeMember('u2', 'read')])).toBe('admin')
  })

  it('returns member role when user is in members list', () => {
    expect(resolveEffectiveRole('u2', makeProject('u1'), [makeMember('u2', 'modify')])).toBe('modify')
  })

  it('returns read when user is neither owner nor member (has access but no explicit role)', () => {
    expect(resolveEffectiveRole('u3', makeProject('u1'), [makeMember('u2', 'read')])).toBe('read')
  })
})

describe('canModify', () => {
  it.each([
    ['admin' as Role, true],
    ['modify' as Role, true],
    ['read' as Role, false],
  ])('role=%s => canModify=%s', (role, expected) => {
    expect(canModify(role)).toBe(expected)
  })
})

describe('isAdmin', () => {
  it.each([
    ['admin' as Role, true],
    ['modify' as Role, false],
    ['read' as Role, false],
  ])('role=%s => isAdmin=%s', (role, expected) => {
    expect(isAdmin(role)).toBe(expected)
  })
})