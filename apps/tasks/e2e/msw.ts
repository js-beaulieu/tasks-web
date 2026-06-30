import { test as base, expect } from '@playwright/test'
import type { ApiTask } from '../src/api/types'
import {
  captureRequest,
  getLastRequest,
  getMockData,
  resetMockData,
  setUpdateNextOccurrenceId,
  getRequestLog,
  type MockData,
  type MockRequestLogEntry,
  type MockSeed,
} from '../src/test/mocks/state'
import {
  handleMockApiRequest,
  isMockApiPath,
  normalizeApiPath,
  type MockResponseSpec,
} from '../src/test/mocks/routes'

export interface MockApi {
  prepare(seed?: MockSeed): Promise<void>
  reset(seed?: MockSeed): Promise<void>
  getState(): Promise<MockData>
  getLastRequest(): Promise<MockRequestLogEntry | undefined>
  getRequestLog(): Promise<MockRequestLogEntry[]>
  setUpdateNextOccurrenceId(taskID: string, nextOccurrenceTask: ApiTask | null): Promise<void>
}

async function logPlaywrightRequest(route: import('@playwright/test').Route): Promise<void> {
  const request = route.request()
  const method = request.method()
  const headers = request.headers()
  const body = method === 'GET' || method === 'HEAD' ? undefined : request.postData() ?? undefined
  await captureRequest(
    new Request(request.url(), {
      method,
      headers,
      body,
    }),
  )
}

function jsonBody(route: import('@playwright/test').Route): unknown {
  const request = route.request()
  const contentType = request.headers()['content-type'] ?? ''
  if (!contentType.includes('application/json')) {
    return undefined
  }
  return request.postDataJSON()
}

async function fulfillJson(route: import('@playwright/test').Route, body: unknown, extraHeaders?: Record<string, string>, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  })
}

async function fulfillProblem(
  route: import('@playwright/test').Route,
  status: number,
  title: string,
  detail?: string,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/problem+json',
    body: JSON.stringify({ type: 'about:blank', title, status, detail }),
  })
}

async function fulfillNoContent(route: import('@playwright/test').Route): Promise<void> {
  await route.fulfill({ status: 204, body: '' })
}

async function fulfillFromSpec(route: import('@playwright/test').Route, spec: MockResponseSpec): Promise<void> {
  if (spec.kind === 'json') {
    return fulfillJson(route, spec.body, spec.headers, spec.status)
  }
  if (spec.kind === 'problem') {
    return fulfillProblem(route, spec.status, spec.title, spec.detail)
  }
  return fulfillNoContent(route)
}

async function handleApiRoute(route: import('@playwright/test').Route): Promise<void> {
  const request = route.request()
  const url = new URL(request.url())
  const pathname = normalizeApiPath(url.pathname)

  await logPlaywrightRequest(route)
  const spec = handleMockApiRequest({
    method: request.method(),
    url,
    pathname,
    jsonBody: jsonBody(route),
  })
  return fulfillFromSpec(route, spec)
}

export const test = base.extend<{ mockApi: MockApi }>({
  page: async ({ page }, use) => {
    resetMockData()
    await page.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (!isMockApiPath(pathname)) {
        await route.continue()
        return
      }
      await handleApiRoute(route)
    })
    await use(page)
  },

  mockApi: async ({ page: _page }, use) => {
    const api: MockApi = {
      async prepare(seed = {}) {
        resetMockData(seed)
      },

      async reset(seed = {}) {
        resetMockData(seed)
      },

      async getState() {
        return getMockData()
      },

      async getLastRequest() {
        return getLastRequest()
      },

      async getRequestLog() {
        return getRequestLog()
      },

      async setUpdateNextOccurrenceId(taskID, nextOccurrenceId) {
        setUpdateNextOccurrenceId(taskID, nextOccurrenceId)
      },
    }

    await use(api)
  },
})

export { expect }
