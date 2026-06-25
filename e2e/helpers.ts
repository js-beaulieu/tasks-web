import { expect } from './msw'
import type { MockApi } from './msw'
import { makeApiTask } from '../src/test/mocks/fixtures'
import type { ApiTask } from '../src/api/types'
import { defaultSeed, type MockSeed, type MockRequestLogEntry } from '../src/test/mocks/state'

const seed = defaultSeed()
export const ME = seed.me!
export const USERS = seed.users ?? []
export const PROJECT = (seed.projects ?? [])[0]!
export const STATUSES = seed.statuses ?? []
export const MEMBERS = seed.members ?? []

export function makeTask(id: string, name: string, status: string, position: number) {
  return makeApiTask({
    id,
    project_id: 'p1',
    name,
    status,
    position,
    owner_id: 'dev-user',
    created_at: '2026-06-14T12:00:00Z',
    updated_at: '2026-06-14T12:00:00Z',
  })
}

export async function seedMockApi(mockApi: MockApi, tasks: unknown[], seed: MockSeed = {}) {
  await mockApi.prepare({
    ...defaultSeed(),
    tasks: tasks as ApiTask[],
    taskTags: {},
    ...seed,
  })
}

export async function enableManualSort(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /manual/i }).click()
  await page.getByRole('menuitem', { name: /manual order/i }).click()
}

export async function openTaskDetail(
  page: import('@playwright/test').Page,
  taskID: string,
  projectID = 'p1',
) {
  await page.evaluate(
    ({ nextProjectID, nextTaskID }) => {
      window.history.pushState({}, '', `/projects/${nextProjectID}/tasks/${nextTaskID}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    { nextProjectID: projectID, nextTaskID: taskID },
  )
}

export async function slowDrag(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 30,
) {
  await page.mouse.move(from.x, from.y)
  await page.waitForTimeout(100)
  await page.mouse.down()
  await page.waitForTimeout(300)

  const stepX = (to.x - from.x) / steps
  const stepY = (to.y - from.y) / steps
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + stepX * i, from.y + stepY * i)
    await page.waitForTimeout(16)
  }

  await page.mouse.up()
}

function isPatchForTask(request: MockRequestLogEntry, taskId: string): boolean {
  return request.method === 'PATCH' && request.pathname.endsWith(`/tasks/${taskId}`)
}

export function routePatch(mockApi: MockApi, taskId: string) {
  return {
    getPatchBody: async () => {
      const requests = await mockApi.getRequestLog()
      const patch = [...requests].reverse().find((request) => isPatchForTask(request, taskId))
      return patch?.body ?? null
    },
  }
}

export function boxCenter(box: { x: number; y: number; width: number; height: number }) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export function boxAbove(
  box: { x: number; y: number; width: number; height: number },
  offset = 5,
) {
  return { x: box.x + box.width / 2, y: box.y - offset }
}

export function boxBelow(
  box: { x: number; y: number; width: number; height: number },
  offset = 5,
) {
  return { x: box.x + box.width / 2, y: box.y + box.height + offset }
}

export async function expectPatchBody(
  getPatchBody: () => Promise<unknown | null>,
  assertions: (body: Record<string, unknown>) => void,
) {
  await expect(async () => {
    const body = (await getPatchBody()) as Record<string, unknown> | null
    expect(body).not.toBeNull()
    assertions(body!)
  }).toPass({ timeout: 15000 })
}
