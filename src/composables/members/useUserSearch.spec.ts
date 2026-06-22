import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { makeApiUser } from '@/test/mocks/fixtures'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { useUserSearch } from './useUserSearch'

function mountWithQuery(component: ReturnType<typeof defineComponent>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 5 * 60 * 1000 } },
  })
  return mount(component, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  })
}

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
