import { test, expect } from '@playwright/test'

const ME = {
  id: 'dev-user',
  name: 'Dev User',
  email: 'dev@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

const USERS = [ME]

const PROJECT = {
  id: 'p1',
  name: 'Task Project',
  description: 'Testing tasks',
  owner_id: 'dev-user',
  created_at: '2026-06-14T15:50:19Z',
  updated_at: '2026-06-14T15:50:19Z',
}

const STATUSES = [
  { project_id: 'p1', status: 'todo', position: 0 },
  { project_id: 'p1', status: 'in_progress', position: 1 },
  { project_id: 'p1', status: 'done', position: 2 },
  { project_id: 'p1', status: 'cancelled', position: 3 },
]

const MEMBERS = [
  { project_id: 'p1', user_id: 'dev-user', role: 'admin' },
]

function mockMe(route: Parameters<typeof route.fulfill>[0]) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(ME),
  })
}

function mockUsers(route: Parameters<typeof route.fulfill>[0]) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(USERS),
  })
}

test.describe('Task lifecycle', () => {
  test('shows tasks grouped by status', async ({ page }) => {
    await page.route('*/**/api/users/me', mockMe)
    await page.route('*/**/api/users?ids=*', mockUsers)
    await page.route('*/**/api/projects/p1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECT) })
    })
    await page.route('*/**/api/projects/p1/statuses', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STATUSES) })
    })
    await page.route('*/**/api/projects/p1/members', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MEMBERS) })
    })
    await page.route('*/**/api/projects/p1/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 't1', project_id: 'p1', parent_id: null, name: 'Buy groceries', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
          { id: 't2', project_id: 'p1', parent_id: null, name: 'Write report', description: 'Q2 report', status: 'in_progress', due_date: '2026-07-01T00:00:00Z', owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T13:00:00Z', updated_at: '2026-06-14T13:00:00Z' },
          { id: 't3', project_id: 'p1', parent_id: null, name: 'Deploy v2', description: null, status: 'done', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T14:00:00Z', updated_at: '2026-06-14T14:00:00Z' },
        ]),
      })
    })

    await page.goto('/projects/p1')

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Write report')).toBeVisible()

    const todoGroup = page.locator('button', { hasText: /To Do/ })
    await expect(todoGroup).toBeVisible()

    const inProgressGroup = page.locator('button', { hasText: /In Progress/ })
    await expect(inProgressGroup).toBeVisible()
  })

  test('can switch between list and board view', async ({ page }) => {
    await page.route('*/**/api/users/me', mockMe)
    await page.route('*/**/api/users?ids=*', mockUsers)
    await page.route('*/**/api/projects/p1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECT) })
    })
    await page.route('*/**/api/projects/p1/statuses', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STATUSES) })
    })
    await page.route('*/**/api/projects/p1/members', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MEMBERS) })
    })
    await page.route('*/**/api/projects/p1/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 't1', project_id: 'p1', parent_id: null, name: 'Test task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
        ]),
      })
    })

    await page.goto('/projects/p1')

    await expect(page.getByText('Test task')).toBeVisible()

    await page.getByRole('button', { name: /board/i }).click()

    const boardColumn = page.locator('[class*="rounded-lg border"]').first()
    await expect(boardColumn).toContainText('To Do')
  })

  test('opens task detail sheet when clicking a task', async ({ page }) => {
    await page.route('*/**/api/users/me', mockMe)
    await page.route('*/**/api/users?ids=*', mockUsers)
    await page.route('*/**/api/projects/p1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECT) })
    })
    await page.route('*/**/api/projects/p1/statuses', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STATUSES) })
    })
    await page.route('*/**/api/projects/p1/members', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MEMBERS) })
    })
    await page.route('*/**/api/projects/p1/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 't1', project_id: 'p1', parent_id: null, name: 'Review PR', description: 'Check the changes', status: 'todo', due_date: '2026-07-01T00:00:00Z', owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
        ]),
      })
    })
    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          { id: 't1', project_id: 'p1', parent_id: null, name: 'Review PR', description: 'Check the changes', status: 'todo', due_date: '2026-07-01T00:00:00Z', owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
        ),
      })
    })

    await page.goto('/projects/p1')

    await page.getByText('Review PR').click()

    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Review PR')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Check the changes')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('To Do')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Dev User')
  })

  test('can quick-add a task in a status group', async ({ page }) => {
    await page.route('*/**/api/users/me', mockMe)
    await page.route('*/**/api/users?ids=*', mockUsers)
    await page.route('*/**/api/projects/p1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECT) })
    })
    await page.route('*/**/api/projects/p1/statuses', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STATUSES) })
    })
    await page.route('*/**/api/projects/p1/members', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MEMBERS) })
    })

    let listCalls = 0
    await page.route('*/**/api/projects/p1/tasks*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(
            { id: 't-new', project_id: 'p1', parent_id: null, name: 'New task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T16:00:00Z', updated_at: '2026-06-14T16:00:00Z' },
          ),
        })
        return
      }

      listCalls++
      const tasks = listCalls > 1
        ? [{ id: 't-new', project_id: 'p1', parent_id: null, name: 'New task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T16:00:00Z', updated_at: '2026-06-14T16:00:00Z' }]
        : []
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tasks) })
    })

    await page.goto('/projects/p1')

    await page.getByRole('button', { name: /add task/i }).first().click()
    await page.getByPlaceholder('Task name…').fill('New task')
    await page.getByRole('button', { name: /^add$/i }).click()

    await expect(page.getByText('New task')).toBeVisible()
  })
})