import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserDisplay from './UserDisplay.vue'

describe('UserDisplay', () => {
  it('renders name, email and initials for a known user', () => {
    const user = {
      id: 'u1',
      name: 'Alice Beaulieu',
      email: 'alice@example.com',
      createdAt: '2026-01-01T00:00:00Z',
    }

    const wrapper = mount(UserDisplay, { props: { user } })

    expect(wrapper.text()).toContain('Alice Beaulieu')
    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.text()).toContain('AB')
  })

  it('uses a single initial for one name part', () => {
    const user = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: '2026-01-01T00:00:00Z',
    }

    const wrapper = mount(UserDisplay, { props: { user } })

    expect(wrapper.text()).toContain('A')
  })
})
