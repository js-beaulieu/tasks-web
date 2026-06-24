import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusSelect from '@/components/tasks/StatusSelect.vue'
import type { ProjectStatus } from '@/api/statuses'

const statuses: ProjectStatus[] = [
  { projectId: 'p1', status: 'todo', position: 0 },
  { projectId: 'p1', status: 'in_progress', position: 1 },
  { projectId: 'p1', status: 'done', position: 2 },
]

describe('StatusSelect', () => {
  it('renders a select trigger element', () => {
    const wrapper = mount(StatusSelect, {
      props: { statuses, modelValue: 'todo' },
    })
    expect(wrapper.find('[role="combobox"]').exists()).toBe(true)
  })

  it('renders with no statuses without crashing', () => {
    const wrapper = mount(StatusSelect, {
      props: { statuses: [], modelValue: '' },
    })
    expect(wrapper.find('[role="combobox"]').exists()).toBe(true)
  })

  it('uses custom placeholder when provided', () => {
    const wrapper = mount(StatusSelect, {
      props: { statuses, modelValue: '', placeholder: 'Pick a status' },
    })

    expect(wrapper.text()).toContain('Pick a status')
  })

  it('uses default placeholder when not provided', () => {
    const wrapper = mount(StatusSelect, {
      props: { statuses, modelValue: '' },
    })

    expect(wrapper.text()).toContain('Select status')
  })
})