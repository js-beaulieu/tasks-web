import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { getLastRequest, getRequestLog, seedMockData } from '@/test/mocks/state'
import { mountWithQuery } from '@/test/mountWithQuery'
import { useTaskTags } from './useTaskTags'

describe('useTaskTags', () => {
  beforeEach(() => {
    seedMockData({ taskTags: {} })
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

    expect(getRequestLog()).toHaveLength(0)
  })

  it('fetches tags when taskID is provided', async () => {
    seedMockData({ taskTags: { t1: ['urgent', 'bug'] } })

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

    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/tasks/t1/tags'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('urgent'))
  })

  it('returns empty array as placeholder before fetch completes', async () => {
    seedMockData({ taskTags: { t1: ['urgent'] } })

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
