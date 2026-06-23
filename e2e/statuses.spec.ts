import { test, expect } from './msw'
import { ME, USERS, PROJECT, STATUSES, MEMBERS } from './helpers'
import { makeApiProjectStatus, makeApiTask } from '../src/test/mocks/fixtures'

test.describe('Status admin', () => {
  test('admin can create a custom status in settings', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: USERS,
      projects: [PROJECT],
      statuses: STATUSES,
      members: MEMBERS,
      tasks: [],
    })

    await page.goto('/projects/p1')
    await page.getByRole('tab', { name: /settings/i }).click()

    await expect(page.getByText('Statuses')).toBeVisible()
    await expect(page.getByText('To Do', { exact: true })).toBeVisible()
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible()
    await expect(page.getByText('Done', { exact: true })).toBeVisible()
    await expect(page.getByText('Cancelled', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /add status/i }).click()
    await page.getByPlaceholder(/Status value/i).fill('review')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(page.getByText('Review', { exact: true })).toBeVisible()
    await expect(page.getByText('review', { exact: true })).toBeVisible()

    const state = await mockApi.getState()
    expect(state.statuses.some((s) => s.project_id === 'p1' && s.status === 'review')).toBe(true)
  })

  test('admin can delete an unused custom status', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: USERS,
      projects: [PROJECT],
      statuses: [
        ...STATUSES,
        makeApiProjectStatus({ project_id: 'p1', status: 'review', position: 4 }),
      ],
      members: MEMBERS,
      tasks: [],
    })

    await page.goto('/projects/p1')
    await page.getByRole('tab', { name: /settings/i }).click()

    await expect(page.getByText('Review', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Delete status review' }).click()

    await page.getByRole('button', { name: /^delete$/i }).click()

    await expect(page.getByText('Review', { exact: true })).toBeHidden()

    const state = await mockApi.getState()
    expect(state.statuses.some((s) => s.project_id === 'p1' && s.status === 'review')).toBe(false)
  })

  test('admin cannot delete a status in use by tasks (409)', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: USERS,
      projects: [PROJECT],
      statuses: [
        makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'review', position: 1 }),
      ],
      members: MEMBERS,
      tasks: [
        makeApiTask({
          id: 't1',
          project_id: 'p1',
          name: 'Task in review',
          status: 'review',
          position: 0,
          owner_id: 'dev-user',
        }),
      ],
    })

    await page.goto('/projects/p1')
    await page.getByRole('tab', { name: /settings/i }).click()

    await expect(page.getByText('Review', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Delete status review' }).click()

    await page.getByRole('button', { name: /^delete$/i }).click()

    await expect(page.getByText(/in use by tasks/i).first()).toBeVisible()

    const state = await mockApi.getState()
    expect(state.statuses.some((s) => s.project_id === 'p1' && s.status === 'review')).toBe(true)
  })

  test('non-admin member sees status list read-only', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: USERS,
      projects: [
        {
          ...PROJECT,
          effective_role: 'read',
        },
      ],
      statuses: STATUSES,
      members: MEMBERS,
      tasks: [],
    })

    await page.goto('/projects/p1')
    await page.getByRole('tab', { name: /settings/i }).click()

    await expect(page.getByText('Statuses')).toBeVisible()
    await expect(page.getByText('To Do', { exact: true })).toBeVisible()

    await expect(page.getByRole('button', { name: /add status/i })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Delete status todo' })).toBeHidden()
  })
})

test.describe('Board view collapsed columns', () => {
  test('done and cancelled are collapsed by default in board view', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: USERS,
      projects: [PROJECT],
      statuses: STATUSES,
      members: MEMBERS,
      tasks: [
        makeApiTask({
          id: 't1',
          project_id: 'p1',
          name: 'Active task',
          status: 'todo',
          position: 0,
          owner_id: 'dev-user',
        }),
        makeApiTask({
          id: 't2',
          project_id: 'p1',
          name: 'Finished task',
          status: 'done',
          position: 0,
          owner_id: 'dev-user',
        }),
      ],
    })

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    await expect(page.getByText('Active task')).toBeVisible()
    await expect(page.getByText('Finished task')).toBeHidden()

    await expect(page.getByText('Expand (1)')).toBeVisible()

    await page.locator('button', { hasText: /^Done/ }).click()
    await expect(page.getByText('Finished task')).toBeVisible()
  })
})