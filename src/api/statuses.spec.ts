import { describe, it, expect, beforeEach } from 'vitest'
import { getLastRequest, seedMockData } from '@/test/mocks/state'
import { makeApiProjectStatus } from '@/test/mocks/fixtures'
import { listProjectStatuses, type ProjectStatus } from './statuses'

beforeEach(() => {
  seedMockData({ statuses: [] })
})

describe('listProjectStatuses', () => {
  it('fetches and maps project statuses', async () => {
    seedMockData({
      statuses: [
        makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'in_progress', position: 1 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'done', position: 2 }),
      ],
    })

    const result = await listProjectStatuses('p1')

    expect(result).toEqual<ProjectStatus[]>([
      { projectId: 'p1', status: 'todo', position: 0 },
      { projectId: 'p1', status: 'in_progress', position: 1 },
      { projectId: 'p1', status: 'done', position: 2 },
    ])
    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/statuses')
  })

  it('encodes project ID in URL', async () => {
    await listProjectStatuses('proj/special')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/proj%2Fspecial/statuses')
  })
})
