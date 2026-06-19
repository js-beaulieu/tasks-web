import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { makeApiTask } from '@/test/mocks/fixtures'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { useSubtasks } from './useSubtasks'

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

describe('useSubtasks', () => {
  beforeEach(() => {
    seedMockData({ tasks: [] })
  })

  it('does not fetch when parentTaskID is undefined', async () => {
    const parentTaskID = ref<string | undefined>(undefined)
    const TestComponent = defineComponent({
      setup() {
        const { data } = useSubtasks(parentTaskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    mountWithQuery(TestComponent)

    expect(getRequestLog()).toHaveLength(0)
  })

  it('fetches subtasks when parentTaskID is provided', async () => {
    seedMockData({
      tasks: [makeApiTask({ id: 's1', project_id: 'p1', parent_id: 't1', name: 'Sub task', owner_id: 'u1' })],
    })

    const parentTaskID = ref<string | undefined>('t1')
    const TestComponent = defineComponent({
      setup() {
        const { data } = useSubtasks(parentTaskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    const wrapper = mountWithQuery(TestComponent)

    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tasks'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Sub task'))
  })

  it('returns empty array as placeholder before fetch completes', async () => {
    const parentTaskID = ref<string | undefined>('t1')
    const TestComponent = defineComponent({
      setup() {
        const { data } = useSubtasks(parentTaskID)
        return { data }
      },
      render() {
        return h('div', JSON.stringify(this.data))
      },
    })

    const wrapper = mountWithQuery(TestComponent)

    expect(wrapper.text()).toBe('[]')
  })
})
