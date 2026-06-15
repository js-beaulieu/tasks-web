import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiList } from '@/api/client'
import { listProjectStatuses, type ProjectStatus } from './statuses'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listProjectStatuses', () => {
  it('fetches and maps project statuses', async () => {
    const apiStatuses = [
      { project_id: 'p1', status: 'todo', position: 0 },
      { project_id: 'p1', status: 'in_progress', position: 1 },
      { project_id: 'p1', status: 'done', position: 2 },
    ]
    vi.mocked(apiList).mockResolvedValue(apiStatuses)

    const result = await listProjectStatuses('p1')

    expect(apiList).toHaveBeenCalledWith('projects/p1/statuses')
    expect(result).toEqual<ProjectStatus[]>([
      { projectId: 'p1', status: 'todo', position: 0 },
      { projectId: 'p1', status: 'in_progress', position: 1 },
      { projectId: 'p1', status: 'done', position: 2 },
    ])
  })

  it('encodes project ID in URL', async () => {
    vi.mocked(apiList).mockResolvedValue([])

    await listProjectStatuses('proj/special')

    expect(apiList).toHaveBeenCalledWith('projects/proj%2Fspecial/statuses')
  })
})