export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
}

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.title)
    this.name = 'ApiError'
  }
}

const baseUrl = (import.meta.env.VITE_TASKS_API_BASE_URL as string | undefined) ?? '/tasks'

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  body?: unknown
}

function buildUrl(path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return `${normalizedBase}/${normalizedPath}`
}

function isJsonBody(body: unknown): boolean {
  if (body === null || typeof body !== 'object') {
    return false
  }

  // Exclude types that fetch can serialize itself and should not be JSON-encoded.
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ReadableStream ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return false
  }

  return true
}

export async function apiClient<T>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const url = buildUrl(path)
  const { body, headers: originalHeaders, ...rest } = options
  const headers = new Headers(originalHeaders as HeadersInit | undefined)

  // The gateway supplies identity from cookies/session headers.
  headers.delete('Authorization')

  if (isJsonBody(body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const hadOriginalHeaders =
    originalHeaders !== undefined &&
    (originalHeaders instanceof Headers
      ? originalHeaders.keys().next().done === false
      : Object.keys(originalHeaders).length > 0)

  const init: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: hadOriginalHeaders || headers.has('Content-Type') ? (headers as Headers) : undefined,
  }

  if (isJsonBody(body)) {
    init.body = JSON.stringify(body)
  } else if (body !== undefined) {
    init.body = body as BodyInit
  }

  const response = await fetch(url, init)

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    if (contentType.includes('application/problem+json')) {
      const problem = (await response.json()) as ProblemDetails
      throw new ApiError(problem)
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as unknown
  return data as T
}

export async function apiList<T>(path: string, options?: ApiRequestInit): Promise<T[]> {
  const data = await apiClient<T[] | null>(path, options)
  return data ?? []
}
