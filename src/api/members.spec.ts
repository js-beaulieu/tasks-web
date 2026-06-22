import { describe, it, expect, beforeEach } from 'vitest'
import { getLastRequest, seedMockData } from '@/test/mocks/state'
import { makeApiProject } from '@/test/mocks/fixtures'
import { makeApiProjectMember } from '@/test/mocks/fixtures'
import {
  listProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  type ProjectMember,
} from './members'

beforeEach(() => {
  seedMockData({ members: [] })
})

describe('listProjectMembers', () => {
  it('fetches and maps members', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'u1' })],
      members: [
        makeApiProjectMember({ project_id: 'p1', user_id: 'u1', role: 'admin' }),
        makeApiProjectMember({ project_id: 'p1', user_id: 'u2', role: 'modify' }),
      ],
    })

    const result = await listProjectMembers('p1')

    expect(result).toEqual<ProjectMember[]>([
      { projectId: 'p1', userId: 'u1', role: 'admin' },
      { projectId: 'p1', userId: 'u2', role: 'modify' },
    ])
    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members')
  })
})

describe('addProjectMember', () => {
  it('adds a member with role', async () => {
    const result = await addProjectMember('p1', { userId: 'u2', role: 'read' })

    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ user_id: 'u2', role: 'read' })
    expect(result.role).toBe('read')
  })
})

describe('updateProjectMember', () => {
  it('patches member role', async () => {
    seedMockData({
      members: [makeApiProjectMember({ project_id: 'p1', user_id: 'u2', role: 'read' })],
    })

    const result = await updateProjectMember('p1', 'u2', 'admin')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members/u2')
    expect(getLastRequest()?.method).toBe('PATCH')
    expect(getLastRequest()?.body).toEqual({ role: 'admin' })
    expect(result.role).toBe('admin')
  })
})

describe('removeProjectMember', () => {
  it('deletes a member', async () => {
    seedMockData({
      members: [makeApiProjectMember({ project_id: 'p1', user_id: 'u2', role: 'read' })],
    })

    const result = await removeProjectMember('p1', 'u2')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members/u2')
    expect(getLastRequest()?.method).toBe('DELETE')
    expect(result.reassigned).toBe(0)
  })
})
