import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, apiList } from '@/api/client'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type Project,
} from './projects'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function mockApiProject(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'p1',
    name: 'Alpha',
    owner_id: 'u1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...partial,
  }
}

function apiToProject(api: Record<string, unknown>): Project {
  return {
    id: api.id as string,
    name: api.name as string,
    description: api.description as string | undefined,
    dueDate: api.due_date as string | undefined,
    ownerId: api.owner_id as string,
    assigneeId: api.assignee_id as string | undefined,
    createdAt: api.created_at as string,
    updatedAt: api.updated_at as string,
  }
}

describe('listProjects', () => {
  it('returns mapped projects ordered by API', async () => {
    const apiProjects = [mockApiProject({ id: 'p1' }), mockApiProject({ id: 'p2', name: 'Beta' })]
    vi.mocked(apiList).mockResolvedValue(apiProjects)

    const result = await listProjects()

    expect(apiList).toHaveBeenCalledWith('projects')
    expect(result).toEqual(apiProjects.map(apiToProject))
  })
})

describe('getProject', () => {
  it('fetches and maps a single project', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiProject())

    const result = await getProject('p1')

    expect(apiClient).toHaveBeenCalledWith('projects/p1')
    expect(result.id).toBe('p1')
    expect(result.ownerId).toBe('u1')
  })
})

describe('createProject', () => {
  it('posts with name only when description is empty', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiProject({ name: 'Alpha' }))

    await createProject({ name: 'Alpha' })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: Record<string, unknown> },
    ]
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({ name: 'Alpha' })
  })

  it('omits description when empty string', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiProject({ name: 'Alpha' }))

    await createProject({ name: 'Alpha', description: '   ' })

    const [, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: Record<string, unknown> },
    ]
    expect(options.body).toEqual({ name: 'Alpha' })
  })
})

describe('updateProject', () => {
  it('patches mapped fields', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiProject({ name: 'Beta', description: 'Updated' }))

    await updateProject('p1', { name: 'Beta', description: 'Updated' })

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string; body: Record<string, unknown> },
    ]
    expect(path).toBe('projects/p1')
    expect(options.method).toBe('PATCH')
    expect(options.body).toEqual({ name: 'Beta', description: 'Updated' })
  })
})

describe('deleteProject', () => {
  it('sends DELETE request', async () => {
    vi.mocked(apiClient).mockResolvedValue(undefined)

    await deleteProject('p1')

    const [path, options] = vi.mocked(apiClient).mock.calls[0] as unknown as [
      string,
      { method: string },
    ]
    expect(path).toBe('projects/p1')
    expect(options.method).toBe('DELETE')
  })
})
