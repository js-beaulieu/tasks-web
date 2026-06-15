import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiList } from '@/api/client'
import { listTags } from './tags'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listTags', () => {
  it('fetches global tags', async () => {
    vi.mocked(apiList).mockResolvedValue(['urgent', 'bug', 'feature'])

    const result = await listTags()

    expect(apiList).toHaveBeenCalledWith('tags')
    expect(result).toEqual(['urgent', 'bug', 'feature'])
  })
})