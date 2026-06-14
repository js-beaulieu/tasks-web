import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, apiList } from '@/api/client'
import { getMe, getUsersByIDs, searchUsers, type User } from './users'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn<() => Promise<unknown>>(),
  apiList: vi.fn<() => Promise<unknown[]>>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const mockUser = (partial: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  ...partial,
})

function mockApiUser(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    created_at: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('getMe', () => {
  it('returns the current user mapped from API shape', async () => {
    vi.mocked(apiClient).mockResolvedValue(mockApiUser())

    const result = await getMe()

    expect(result).toEqual(mockUser())
  })
})

describe('getUsersByIDs', () => {
  it('returns an empty array when no IDs are provided', async () => {
    const result = await getUsersByIDs([])

    expect(result).toEqual([])
    expect(apiList).not.toHaveBeenCalled()
  })

  it('requests users by repeated ids query params and maps response', async () => {
    vi.mocked(apiList).mockResolvedValue([
      mockApiUser(),
      mockApiUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' }),
    ])

    const result = await getUsersByIDs(['u1', 'u2'])

    expect(apiList).toHaveBeenCalledWith('users?ids=u1&ids=u2')
    expect(result).toEqual([
      mockUser(),
      mockUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' }),
    ])
  })

  it('encodes IDs in query params', async () => {
    vi.mocked(apiList).mockResolvedValue([])

    await getUsersByIDs(['user with space', 'user&special'])

    const expected = new URLSearchParams()
    expected.append('ids', 'user with space')
    expected.append('ids', 'user&special')
    expect(apiList).toHaveBeenCalledWith(`users?${expected.toString()}`)
  })

  it('preserves duplicate IDs in the request', async () => {
    vi.mocked(apiList).mockResolvedValue([mockApiUser()])

    await getUsersByIDs(['u1', 'u1', 'u2'])

    const calledPath = vi.mocked(apiList).mock.calls[0]?.[0] as string
    const matches = calledPath.match(/ids=/g)
    expect(matches).toHaveLength(3)
  })
})

describe('searchUsers', () => {
  it('searches users with a query and default limit', async () => {
    vi.mocked(apiList).mockResolvedValue([mockApiUser({ id: 'u2', name: 'Bob' })])

    const result = await searchUsers('bob')

    expect(apiList).toHaveBeenCalledWith('users?search=bob&limit=20')
    expect(result).toEqual([mockUser({ id: 'u2', name: 'Bob' })])
  })

  it('allows overriding the limit', async () => {
    vi.mocked(apiList).mockResolvedValue([])

    await searchUsers('bob', 5)

    expect(apiList).toHaveBeenCalledWith('users?search=bob&limit=5')
  })
})
