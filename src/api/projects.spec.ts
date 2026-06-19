import { describe, it, expect, beforeEach } from 'vitest'
import { makeApiProject } from '@/test/mocks/fixtures'
import { getLastRequest, seedMockData } from '@/test/mocks/state'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type Project,
} from './projects'

beforeEach(() => {
  seedMockData({
    projects: [makeApiProject({ id: 'p1', name: 'Alpha', owner_id: 'u1' })],
  })
})

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
    const apiProjects = [
      makeApiProject({ id: 'p1', name: 'Alpha', owner_id: 'u1' }),
      makeApiProject({ id: 'p2', name: 'Beta', owner_id: 'u1' }),
    ]
    seedMockData({ projects: apiProjects })

    const result = await listProjects()

    expect(getLastRequest()?.pathname).toBe('/tasks/projects')
    expect(result).toEqual(apiProjects.map(apiToProject))
  })
})

describe('getProject', () => {
  it('fetches and maps a single project', async () => {
    const result = await getProject('p1')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1')
    expect(result.id).toBe('p1')
    expect(result.ownerId).toBe('u1')
  })
})

describe('createProject', () => {
  it('posts with name only when description is empty', async () => {
    seedMockData({ projects: [], nextProjectID: 'p1' })

    const result = await createProject({ name: 'Alpha' })

    expect(getLastRequest()?.method).toBe('POST')
    expect(getLastRequest()?.body).toEqual({ name: 'Alpha' })
    expect(result.name).toBe('Alpha')
  })

  it('omits description when empty string', async () => {
    seedMockData({ projects: [], nextProjectID: 'p1' })

    await createProject({ name: 'Alpha', description: '   ' })

    expect(getLastRequest()?.body).toEqual({ name: 'Alpha' })
  })
})

describe('updateProject', () => {
  it('patches mapped fields', async () => {
    const result = await updateProject('p1', { name: 'Beta', description: 'Updated' })

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1')
    expect(getLastRequest()?.method).toBe('PATCH')
    expect(getLastRequest()?.body).toEqual({ name: 'Beta', description: 'Updated' })
    expect(result.name).toBe('Beta')
    expect(result.description).toBe('Updated')
  })
})

describe('deleteProject', () => {
  it('sends DELETE request', async () => {
    await deleteProject('p1')

    expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1')
    expect(getLastRequest()?.method).toBe('DELETE')
  })
})
