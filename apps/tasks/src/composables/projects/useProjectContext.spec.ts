import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { provideProjectContext, useProjectContext } from './useProjectContext'

describe('useProjectContext', () => {
  it('returns undefined when no provider exists', () => {
    const Consumer = defineComponent({
      setup() {
        const ctx = useProjectContext()
        return () => h('div', ctx ? 'present' : 'missing')
      },
    })

    const wrapper = mount(Consumer)
    expect(wrapper.text()).toBe('missing')
  })

  it('provides and injects project context values', () => {
    const Consumer = defineComponent({
      setup() {
        const ctx = useProjectContext()!
        return () =>
          h('div', `${ctx.projectID.value}|${ctx.statuses.value.length}|${ctx.canModify.value}`)
      },
    })

    const Provider = defineComponent({
      setup() {
        provideProjectContext({
          projectID: computed(() => 'p1'),
          statuses: computed(() => [{ projectId: 'p1', status: 'todo', position: 0 }]),
          usersByID: computed(() => ({
            u1: {
              id: 'u1',
              name: 'Alice',
              email: 'a@example.com',
              createdAt: '2026-01-01T00:00:00Z',
            },
          })),
          canModify: computed(() => true),
        })
        return () => h(Consumer)
      },
    })

    const wrapper = mount(Provider)
    expect(wrapper.text()).toBe('p1|1|true')
  })
})
