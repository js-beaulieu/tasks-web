import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { useTaskTags } from './useTaskTags'
import * as tasksApi from '@/api/tasks'

vi.mock('@/api/tasks', () => ({
  listTaskTags: vi.fn<() => Promise<ReturnType<typeof tasksApi.listTaskTags>>>(),
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

describe('useTaskTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when taskID is undefined', async () => {
    const taskID = ref<string | undefined>(undefined)
    const TestComponent = defineComponent({
      setup() {
        const { data } = useTaskTags(taskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    mountWithQuery(TestComponent)

    expect(tasksApi.listTaskTags).not.toHaveBeenCalled()
  })

  it('fetches tags when taskID is provided', async () => {
    vi.mocked(tasksApi.listTaskTags).mockResolvedValue(['urgent', 'bug'])

    const taskID = ref<string | undefined>('t1')
    const TestComponent = defineComponent({
      setup() {
        const { data } = useTaskTags(taskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    const wrapper = mountWithQuery(TestComponent)

    await vi.waitFor(() => expect(tasksApi.listTaskTags).toHaveBeenCalledWith('t1'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('urgent'))
  })

  it('returns empty array as placeholder before fetch completes', async () => {
    vi.mocked(tasksApi.listTaskTags).mockResolvedValue(['urgent'])

    const taskID = ref<string | undefined>('t1')
    const TestComponent = defineComponent({
      setup() {
        const { data } = useTaskTags(taskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    const wrapper = mountWithQuery(TestComponent)

    expect(wrapper.text()).toBe('[]')
    await vi.waitFor(() => expect(wrapper.text()).toContain('urgent'))
  })
})
