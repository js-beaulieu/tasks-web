import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { useSubtasks } from './useSubtasks'
import * as tasksApi from '@/api/tasks'

vi.mock('@/api/tasks', () => ({
  listSubtasks: vi.fn<() => Promise<ReturnType<typeof tasksApi.listSubtasks>>>(),
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

describe('useSubtasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    expect(tasksApi.listSubtasks).not.toHaveBeenCalled()
  })

  it('fetches subtasks when parentTaskID is provided', async () => {
    vi.mocked(tasksApi.listSubtasks).mockResolvedValue([
      {
        id: 's1',
        projectId: 'p1',
        parentId: 't1',
        name: 'Sub task',
        description: null,
        status: 'todo',
        dueDate: null,
        ownerId: 'u1',
        assigneeId: null,
        position: 0,
        recurrence: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ])

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

    await vi.waitFor(() => expect(tasksApi.listSubtasks).toHaveBeenCalledWith('t1'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Sub task'))
  })

  it('returns empty array as placeholder before fetch completes', async () => {
    vi.mocked(tasksApi.listSubtasks).mockResolvedValue([])

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
