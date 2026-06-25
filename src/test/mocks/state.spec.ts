import { describe, it, expect } from 'vitest'
import { defaultSeed, resetMockData, getMockData, seedMockData } from './state'

describe('defaultSeed', () => {
  it('returns the same default project, members, statuses, and IDs as defaultState', () => {
    const seed = defaultSeed()
    expect(seed.me?.id).toBe('dev-user')
    expect(seed.users?.length).toBe(1)
    expect(seed.projects?.[0]?.id).toBe('p1')
    expect(seed.members?.[0]?.project_id).toBe('p1')
    expect(seed.statuses?.map((s) => s.status)).toEqual(['todo', 'in_progress', 'done'])
    expect(seed.nextProjectID).toBe('p-new')
    expect(seed.nextTaskID).toBe('t-new')
  })

  it('seedMockData still applies seed without caller-side clone', () => {
    seedMockData({ projects: [{ id: 'p2', name: 'Other', owner_id: 'dev-user', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' }] })
    const data = getMockData()
    expect(data.projects[0]?.id).toBe('p2')
    resetMockData()
  })
})
