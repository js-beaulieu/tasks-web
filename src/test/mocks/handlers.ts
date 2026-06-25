import { HttpResponse, http } from 'msw'
import { captureRequest } from './state'
import {
  handleMockApiRequest,
  isMockApiPath,
  normalizeApiPath,
  type MockResponseSpec,
} from './routes'

function toHttpResponse(spec: MockResponseSpec): Response {
  if (spec.kind === 'json') {
    return HttpResponse.json(spec.body as object | null, {
      status: spec.status ?? 200,
      headers: spec.headers,
    })
  }
  if (spec.kind === 'problem') {
    return HttpResponse.json(
      {
        type: 'about:blank',
        title: spec.title,
        status: spec.status,
        detail: spec.detail,
      },
      {
        status: spec.status,
        headers: { 'content-type': 'application/problem+json' },
      },
    )
  }
  return new HttpResponse(null, { status: 204 })
}

async function parseJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (request.method === 'GET' || request.method === 'HEAD' || !contentType.includes('application/json')) {
    return undefined
  }
  return request.json()
}

export const handlers = [
  http.all('*', async ({ request }) => {
    const url = new URL(request.url)
    if (!isMockApiPath(url.pathname)) {
      return undefined
    }

    await captureRequest(request)
    const spec = handleMockApiRequest({
      method: request.method,
      url,
      pathname: normalizeApiPath(url.pathname),
      jsonBody: await parseJsonBody(request),
    })
    return toHttpResponse(spec)
  }),
]
