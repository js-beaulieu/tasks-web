import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref, computed } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { useUsersByID } from './useUsersByID'
import * as usersApi from '@/api/users'

vi.mock('@/api/users', () => ({
  getUsersByIDs: vi.fn<() => Promise<ReturnType<typeof usersApi.getUsersByIDs>>>(),
}))

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

describe('useUsersByID', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches users when IDs change from empty to non-empty', async () => {
    vi.mocked(usersApi.getUsersByIDs).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-01-01T00:00:00Z' },
    ])

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

    expect(usersApi.getUsersByIDs).not.toHaveBeenCalled()

    ids.value = ['u1']
    await vi.waitFor(() => expect(usersApi.getUsersByIDs).toHaveBeenCalled())

    expect(usersApi.getUsersByIDs).toHaveBeenCalledWith(['u1'])
  })

  it('fetches when derived IDs from async data become available', async () => {
    vi.mocked(usersApi.getUsersByIDs).mockResolvedValue([
      { id: 'dev-user', name: 'Dev User', email: 'dev@example.com', createdAt: '2026-01-01T00:00:00Z' },
    ])

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

    expect(usersApi.getUsersByIDs).not.toHaveBeenCalled()

    projects.value = [{ ownerId: 'dev-user' }]
    await vi.waitFor(() => expect(usersApi.getUsersByIDs).toHaveBeenCalled())

    expect(usersApi.getUsersByIDs).toHaveBeenCalledWith(['dev-user'])
  })

  it('returns placeholderData immediately and replaces it with fetched users', async () => {
    vi.mocked(usersApi.getUsersByIDs).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-01-01T00:00:00Z' },
    ])

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
    await vi.waitFor(() => expect(usersApi.getUsersByIDs).toHaveBeenCalled())
    await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'))
  })
})
