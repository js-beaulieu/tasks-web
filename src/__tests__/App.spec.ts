import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from '../App.vue'
import * as usersApi from '../api/users'
import { ApiError } from '../api/client'

describe('App', () => {
  function wrapperWithQuery() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return mount(App, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: { ThemeToggle: true, RouterLink: true },
      },
    })
  }

  it('renders loading state while fetching current user', () => {
    vi.spyOn(usersApi, 'getMe').mockImplementation(() => new Promise(() => {}))

    const wrapper = wrapperWithQuery()
    expect(wrapper.text()).toContain('Loading your account')
  })

  it('renders current user when fetch succeeds', async () => {
    vi.spyOn(usersApi, 'getMe').mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      preferredIdentity: 'alice',
    })

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'))

    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.text()).toContain('Preferred identity: alice')
  })

  it('renders session error when fetch fails', async () => {
    vi.spyOn(usersApi, 'getMe').mockRejectedValue(new Error('Network error'))

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Could not load session'))

    expect(wrapper.text()).toContain('Network error')
  })

  it('renders 401 access error', async () => {
    vi.spyOn(usersApi, 'getMe').mockRejectedValue(
      new ApiError({
        type: '',
        title: 'Unauthorized',
        status: 401,
        detail: 'Session expired',
      }),
    )

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Session expired'))
  })
})
