import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, apiList } from '@/api/client'
import {
  listProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  type ProjectMember,
} from './members'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listProjectMembers', () => {
  it('fetches and maps members', async () => {
    const apiMembers = [
      { project_id: 'p1', user_id: 'u1', role: 'admin' },
      { project_id: 'p1', user_id: 'u2', role: 'modify' },
    ]
    vi.mocked(apiList).mockResolvedValue(apiMembers)

    const result = await listProjectMembers('p1')

    expect(apiList).toHaveBeenCalledWith('projects/p1/members')
    expect(result).toEqual<ProjectMember[]>([
      { projectId: 'p1', userId: 'u1', role: 'admin' },
      { projectId: 'p1', userId: 'u2', role: 'modify' },
    ])
  })
})

describe('addProjectMember', () => {
  it('adds a member with role', async () => {
    vi.mocked(apiClient).mockResolvedValue({
      project_id: 'p1',
      user_id: 'u2',
      role: 'read',
    })

    const result = await addProjectMember('p1', { userId: 'u2', role: 'read' })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ user_id: 'u2', role: 'read' })
    expect(result.role).toBe('read')
  })
})

describe('updateProjectMember', () => {
  it('patches member role', async () => {
    vi.mocked(apiClient).mockResolvedValue({
      project_id: 'p1',
      user_id: 'u2',
      role: 'admin',
    })

    const result = await updateProjectMember('p1', 'u2', 'admin')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: unknown },
    ]
    expect(path).toBe('projects/p1/members/u2')
    expect(options.method).toBe('PATCH')
    expect(options.body).toEqual({ role: 'admin' })
    expect(result.role).toBe('admin')
  })
})

describe('removeProjectMember', () => {
  it('deletes a member', async () => {
    vi.mocked(apiClient).mockResolvedValue({ reassigned: 3 })

    const result = await removeProjectMember('p1', 'u2')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string },
    ]
    expect(path).toBe('projects/p1/members/u2')
    expect(options.method).toBe('DELETE')
    expect(result.reassigned).toBe(3)
  })
})