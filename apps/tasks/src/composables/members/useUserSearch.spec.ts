import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { makeApiUser } from '@/test/mocks/fixtures'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { mountWithQuery } from '@/test/mountWithQuery'
import { useUserSearch } from './useUserSearch'

describe('useUserSearch', () => {
  beforeEach(() => {
    seedMockData({
      users: [
        makeApiUser({ id: 'dev-user', name: 'Dev User', email: 'dev@example.com' }),
        makeApiUser({ id: 'u2', name: 'Bob Example', email: 'bob@example.com' }),
      ],
    })
  })

  it('does not fetch until the query is at least 2 characters', async () => {
    const query = ref('b')
    const TestComponent = defineComponent({
      setup() {
        const { data } = useUserSearch(query)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    mountWithQuery(TestComponent)

    expect(getRequestLog()).toHaveLength(0)

    query.value = 'bo'
    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/users'))
    expect(getLastRequest()?.searchParams).toEqual({ search: ['bo'], limit: ['20'] })
  })
})
