import { describe, it, expect, beforeEach } from 'vitest'
import { getLastRequest, seedMockData } from '@/test/mocks/state'
import { makeApiProjectStatus, makeApiProject } from '@/test/mocks/fixtures'
import {
  listProjectStatuses,
  createProjectStatus,
  deleteProjectStatus,
  type ProjectStatus,
} from './statuses'

beforeEach(() => {
  seedMockData({ statuses: [] })
})

describe('listProjectStatuses', () => {
  it('fetches and maps project statuses', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
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

describe('createProjectStatus', () => {
  it('posts and maps created status', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
      statuses: [makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 })],
    })

    const result = await createProjectStatus('p1', 'review')

    expect(result).toEqual<ProjectStatus>({
      projectId: 'p1',
      status: 'review',
      position: 1,
    })
    const req = getLastRequest()
    expect(req?.method).toBe('POST')
    expect(req?.pathname).toBe('/tasks/projects/p1/statuses')
    expect(req?.body).toEqual({ status: 'review' })
  })

  it('encodes project ID in URL', async () => {
    seedMockData({ statuses: [] })

    await createProjectStatus('proj/special', 'review')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/proj%2Fspecial/statuses')
  })

  it('throws on duplicate status (409)', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
      statuses: [makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 })],
    })

    await expect(createProjectStatus('p1', 'todo')).rejects.toThrow('Conflict')
  })
})

describe('deleteProjectStatus', () => {
  it('deletes status and returns void', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
      statuses: [
        makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'review', position: 1 }),
      ],
    })

    await deleteProjectStatus('p1', 'review')

    const req = getLastRequest()
    expect(req?.method).toBe('DELETE')
    expect(req?.pathname).toBe('/tasks/projects/p1/statuses/review')
  })

  it('encodes project ID and status in URL', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'proj/special', owner_id: 'dev-user' })],
      statuses: [
        makeApiProjectStatus({ project_id: 'proj/special', status: 'in review', position: 0 }),
      ],
    })

    await deleteProjectStatus('proj/special', 'in review')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/proj%2Fspecial/statuses/in%20review')
  })

  it('throws on status in use by tasks (409)', async () => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
      statuses: [makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 })],
      tasks: [
        {
          id: 't1',
          project_id: 'p1',
          name: 'Task in todo',
          status: 'todo',
          owner_id: 'dev-user',
          position: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ],
    })

    await expect(deleteProjectStatus('p1', 'todo')).rejects.toThrow('Conflict')
  })

  it('throws on not found (404)', async () => {
    seedMockData({ statuses: [] })

    await expect(deleteProjectStatus('p1', 'nonexistent')).rejects.toThrow('Not Found')
  })
})
