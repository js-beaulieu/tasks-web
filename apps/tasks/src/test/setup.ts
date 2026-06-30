import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from './mocks/server'
import { resetMockData } from './mocks/state'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  resetMockData()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
