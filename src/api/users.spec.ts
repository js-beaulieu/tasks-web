import { describe, it, expect, beforeEach } from 'vitest'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { makeApiUser } from '@/test/mocks/fixtures'
import { getMe, getUsersByIDs, searchUsers, type User } from './users'

beforeEach(() => {
  seedMockData({
    users: [
      makeApiUser(),
      makeApiUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' }),
    ],
  })
})

const mockUser = (partial: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  ...partial,
})

describe('getMe', () => {
  it('returns the current user mapped from API shape', async () => {
    seedMockData({
      me: makeApiUser({ id: 'u1', name: 'Alice', email: 'alice@example.com' }),
    })

    const result = await getMe()

    expect(result).toEqual(mockUser())
    expect(getLastRequest()?.pathname).toBe('/tasks/users/me')
  })
})

describe('getUsersByIDs', () => {
  it('returns an empty array when no IDs are provided', async () => {
    const result = await getUsersByIDs([])

    expect(result).toEqual([])
    expect(getRequestLog()).toHaveLength(0)
  })

  it('requests users by repeated ids query params and maps response', async () => {
    seedMockData({
      users: [
        makeApiUser({ id: 'u1', name: 'Alice', email: 'alice@example.com' }),
        makeApiUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' }),
      ],
    })

    const result = await getUsersByIDs(['u1', 'u2'])

    expect(result).toEqual([
      mockUser(),
      mockUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' }),
    ])
    expect(getLastRequest()?.pathname).toBe('/tasks/users')
    expect(getLastRequest()?.searchParams.ids).toEqual(['u1', 'u2'])
  })

  it('encodes IDs in query params', async () => {
    seedMockData({ users: [] })

    await getUsersByIDs(['user with space', 'user&special'])

    expect(getLastRequest()?.searchParams.ids).toEqual(['user with space', 'user&special'])
  })

  it('preserves duplicate IDs in the request', async () => {
    seedMockData({ users: [makeApiUser({ id: 'u1' })] })

    await getUsersByIDs(['u1', 'u1', 'u2'])

    expect(getLastRequest()?.searchParams.ids).toEqual(['u1', 'u1', 'u2'])
  })
})

describe('searchUsers', () => {
  it('searches users with a query and default limit', async () => {
    seedMockData({ users: [makeApiUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' })] })

    const result = await searchUsers('bob')

    expect(result).toEqual([mockUser({ id: 'u2', name: 'Bob', email: 'bob@example.com' })])
    expect(getLastRequest()?.pathname).toBe('/tasks/users')
    expect(getLastRequest()?.searchParams).toEqual({ search: ['bob'], limit: ['20'] })
  })

  it('allows overriding the limit', async () => {
    seedMockData({ users: [] })

    await searchUsers('bob', 5)

    expect(getLastRequest()?.searchParams).toEqual({ search: ['bob'], limit: ['5'] })
  })
})
