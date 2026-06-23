import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { makeApiTask } from '@/test/mocks/fixtures'
import { seedMockData, setCompletionNextTask } from '@/test/mocks/state'
import { useCompleteTask } from './useCompleteTask'

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn<(message: string, options?: Record<string, unknown>) => void>(),
    error: vi.fn<(message: string) => void>(),
  },
}))

import { toast } from 'vue-sonner'

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

describe('useCompleteTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seedMockData({
      tasks: [makeApiTask({ id: 't1', project_id: 'p1', owner_id: 'u1', status: 'todo' })],
    })
  })

  it('shows toast when completing a recurring task spawns a next occurrence', async () => {
    const nextTask = makeApiTask({ id: 't2', project_id: 'p1', status: 'todo', owner_id: 'u1' })
    setCompletionNextTask('t1', nextTask)

    const success = ref(false)
    const TestComponent = defineComponent({
      setup() {
        const mutation = useCompleteTask()
        const trigger = () => {
          mutation.mutate(
            { taskID: 't1', doneStatus: 'done', projectID: 'p1' },
            { onSuccess: () => { success.value = true } },
          )
        }
        return { trigger }
      },
      render() {
        return h('div', { onClick: this.trigger }, 'complete')
      },
    })

    const wrapper = mountWithQuery(TestComponent)
    await wrapper.find('div').trigger('click')

    await vi.waitFor(() => {
      expect(success.value).toBe(true)
    })

    expect(toast.success).toHaveBeenCalledWith(
      'Task completed',
      { description: 'Next occurrence created.' },
    )
  })

  it('does not show toast for non-recurring completion', async () => {
    const success = ref(false)
    const TestComponent = defineComponent({
      setup() {
        const mutation = useCompleteTask()
        const trigger = () => {
          mutation.mutate(
            { taskID: 't1', doneStatus: 'done', projectID: 'p1' },
            { onSuccess: () => { success.value = true } },
          )
        }
        return { trigger }
      },
      render() {
        return h('div', { onClick: this.trigger }, 'complete')
      },
    })

    const wrapper = mountWithQuery(TestComponent)
    await wrapper.find('div').trigger('click')

    await vi.waitFor(() => {
      expect(success.value).toBe(true)
    })

    expect(toast.success).not.toHaveBeenCalled()
  })
})