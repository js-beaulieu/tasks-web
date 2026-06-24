import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref, computed } from 'vue'
import { makeApiUser } from '@/test/mocks/fixtures'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { mountWithQuery } from '@/test/mountWithQuery'
import { useUsersByID } from './useUsersByID'

describe('useUsersByID', () => {
  beforeEach(() => {
    seedMockData({ users: [makeApiUser({ id: 'u1', name: 'Alice', email: 'alice@example.com' })] })
  })

  it('fetches users when IDs change from empty to non-empty', async () => {
    const ids = ref<string[]>([])
    const TestComponent = defineComponent({
      setup() {
        const { data } = useUsersByID(ids)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    mountWithQuery(TestComponent)

    expect(getRequestLog()).toHaveLength(0)

    ids.value = ['u1']
    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/users'))

    expect(getLastRequest()?.searchParams.ids).toEqual(['u1'])
  })

  it('fetches when derived IDs from async data become available', async () => {
    seedMockData({
      users: [makeApiUser({ id: 'dev-user', name: 'Dev User', email: 'dev@example.com' })],
    })

    const projects = ref<Array<{ ownerId: string }> | undefined>(undefined)
    const ownerIDs = computed(() => projects.value?.map((p) => p.ownerId) ?? [])

    const TestComponent = defineComponent({
      setup() {
        const { data } = useUsersByID(ownerIDs)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    mountWithQuery(TestComponent)

    expect(getRequestLog()).toHaveLength(0)

    projects.value = [{ ownerId: 'dev-user' }]
    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/users'))

    expect(getLastRequest()?.searchParams.ids).toEqual(['dev-user'])
  })

  it('returns placeholderData immediately and replaces it with fetched users', async () => {
    const ids = ref<string[]>(['u1'])
    const TestComponent = defineComponent({
      setup() {
        const { data } = useUsersByID(ids)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    const wrapper = mountWithQuery(TestComponent)

    expect(wrapper.text()).toBe('{}')
    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/users'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'))
  })
})
