import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { delay, HttpResponse, http } from 'msw'
import { makeApiUser } from '@/test/mocks/fixtures'
import { seedMockData } from '@/test/mocks/state'
import { server } from '@/test/mocks/server'
import App from '../App.vue'

describe('App', () => {
  function wrapperWithQuery() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return mount(App, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: { ThemeToggle: true, RouterLink: true, RouterView: true },
      },
    })
  }

  it('renders loading state while fetching current user', () => {
    server.use(
      http.get('*/tasks/users/me', async () => {
        await new Promise(() => {})
        return HttpResponse.json({})
      }),
    )

    const wrapper = wrapperWithQuery()
    expect(wrapper.text()).toContain('Loading your account')
  })

  it('renders current user when fetch succeeds', async () => {
    seedMockData({
      me: makeApiUser({ id: 'u1', name: 'Alice', email: 'alice@example.com' }),
      users: [makeApiUser({ id: 'u1', name: 'Alice', email: 'alice@example.com' })],
    })

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Alice'))

    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('renders session error when fetch fails', async () => {
    server.use(
      http.get('*/tasks/users/me', async () => {
        await delay(1)
        return new HttpResponse('boom', { status: 500, statusText: 'Internal Server Error' })
      }),
    )

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Could not load account'))

    expect(wrapper.text()).toContain('HTTP 500: Internal Server Error')
  })

  it('renders 401 access error', async () => {
    server.use(
      http.get('*/tasks/users/me', async () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Unauthorized',
            status: 401,
            detail: 'Session expired',
          },
          {
            status: 401,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    )

    const wrapper = wrapperWithQuery()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Session expired'))
  })
})
