import { describe, it, expect, beforeEach } from 'vitest'
import { getLastRequest, seedMockData } from '@/test/mocks/state'
import { listTags } from './tags'

beforeEach(() => {
  seedMockData({ taskTags: { t1: ['urgent'], t2: ['bug', 'feature'] } })
})

describe('listTags', () => {
  it('fetches global tags', async () => {
    const result = await listTags()

    expect(result).toEqual(['urgent', 'bug', 'feature'])
    expect(getLastRequest()?.pathname).toBe('/tasks/tags')
  })
})
