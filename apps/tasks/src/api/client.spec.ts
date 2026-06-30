import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest'
import { apiClient, apiList, ApiError, TimeoutError } from './client'

function mockFetch(response: object): Mock<() => Promise<object>> {
  return vi.fn<() => Promise<object>>().mockResolvedValue(response)
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('prefixes requests with VITE_TASKS_API_BASE_URL default', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'u1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('/users/me')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/tasks/users/me')
    expect(init.credentials).toBe('include')
  })

  it('does not send browser Authorization or Content-Type on bodyless GET', async () => {
    // The gateway supplies identity via trusted headers/cookies, not a
    // browser-managed Authorization token, so the frontend must never set one.
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'u1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('users/me')

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).toBeUndefined()
    expect(init.credentials).toBe('include')
  })

  it('forwards gateway identity headers but still strips Authorization', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'u1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('users/me', {
      headers: {
        'X-User-ID': 'dev-user',
        'X-User-Name': 'Dev User',
        'X-User-Email': 'dev@example.com',
        Authorization: 'Bearer secret',
      },
    })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('X-User-ID')).toBe('dev-user')
    expect(headers.get('X-User-Name')).toBe('Dev User')
    expect(headers.get('X-User-Email')).toBe('dev@example.com')
    expect(headers.has('Authorization')).toBe(false)
  })

  it('serializes JSON bodies with Content-Type', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('projects', {
      method: 'POST',
      body: { name: 'Alpha' },
    })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.body).toBe(JSON.stringify({ name: 'Alpha' }))
    expect(init.headers).toBeInstanceOf(Headers)
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('preserves existing Content-Type header', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('upload', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'raw',
    })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Headers).get('Content-Type')).toBe('text/plain')
  })

  it('deletes Authorization header from caller', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('users/me', {
      headers: { Authorization: 'Bearer secret' },
    })

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Headers).has('Authorization')).toBe(false)
  })

  it('returns undefined data for 204 No Content', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: new Headers(),
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { data } = await apiClient('tasks/1/complete', { method: 'POST' })

    expect(data).toBeUndefined()
  })

  it('parses problem+json into ApiError', async () => {
    const problem = {
      type: 'https://tasks.local/errors/auth',
      title: 'Unauthorized',
      status: 401,
      detail: 'No session cookie.',
    }

    const fetchMock = mockFetch({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({
        'content-type': 'application/problem+json',
      }),
      json: async () => problem,
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient('users/me')).rejects.toBeInstanceOf(ApiError)
    await expect(apiClient('users/me')).rejects.toMatchObject({
      problem: { status: 401, title: 'Unauthorized' },
    })
  })

  it('throws generic error for non-problem errors', async () => {
    const fetchMock = mockFetch({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({ 'content-type': 'text/plain' }),
      json: async () => 'boom',
      text: async () => 'boom',
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient('users/me')).rejects.toThrow('HTTP 500: Internal Server Error')
  })

  it('throws TimeoutError when request exceeds timeout', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const promise = apiClient('users/me', { timeout: 5000 })
    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toBeInstanceOf(TimeoutError)
    vi.useRealTimers()
  })

  it('allows overriding timeout per request', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const promise = apiClient('users/me', { timeout: 100 })
    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toBeInstanceOf(TimeoutError)
    vi.useRealTimers()
  })

  it('clears timeout when request succeeds', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: 'u1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('users/me')

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})

describe('apiList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes null responses to empty arrays', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => null,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiList('projects')
    expect(result).toEqual([])
  })

  it('preserves non-null arrays', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [{ id: 'p1' }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiList('projects')
    expect(result).toEqual([{ id: 'p1' }])
  })
})
