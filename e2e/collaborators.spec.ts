import { test, expect } from './msw'
import { ME, PROJECT, STATUSES } from './helpers'

const READ_PROJECT = { ...PROJECT, effective_role: 'read' }

test.describe('Collaborators', () => {
  test('admin can add a collaborator from user search', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: [
        ME,
        {
          id: 'u2',
          name: 'Alex Member',
          email: 'alex@example.com',
          created_at: '2026-01-02T00:00:00Z',
        },
      ],
      projects: [PROJECT],
      statuses: STATUSES,
      members: [],
      tasks: [],
    })

    await page.goto('/projects/p1?tab=members')

    await page.getByLabel('Search users').fill('alex')
    await expect(page.getByText('Alex Member')).toBeVisible()

    await page.getByLabel('Role for new collaborator').selectOption('modify')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(async () => {
      const state = await mockApi.getState()
      expect(state.members).toEqual([
        {
          project_id: 'p1',
          user_id: 'u2',
          role: 'modify',
        },
      ])
    }).toPass()

    await expect(page.getByLabel('Role for Alex Member')).toHaveValue('modify')
  })

  test('admin can change roles and remove collaborators', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: ME,
      users: [
        ME,
        {
          id: 'u2',
          name: 'Taylor Collaborator',
          email: 'taylor@example.com',
          created_at: '2026-01-02T00:00:00Z',
        },
      ],
      projects: [PROJECT],
      statuses: STATUSES,
      members: [{ project_id: 'p1', user_id: 'u2', role: 'modify' }],
      tasks: [
        {
          id: 't1',
          project_id: 'p1',
          name: 'Assigned task',
          status: 'todo',
          owner_id: 'dev-user',
          assignee_id: 'u2',
          position: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    })

    await page.goto('/projects/p1?tab=members')

    await page.getByLabel('Role for Taylor Collaborator').selectOption('read')
    await page.getByRole('button', { name: 'Save role' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(async () => {
      const state = await mockApi.getState()
      expect(state.members).toEqual([
        {
          project_id: 'p1',
          user_id: 'u2',
          role: 'read',
        },
      ])
    }).toPass()

    await page.getByRole('button', { name: 'Remove Taylor Collaborator' }).click()
    await page.getByRole('button', { name: 'Remove' }).click()

    await expect(async () => {
      const state = await mockApi.getState()
      expect(state.members).toEqual([])
      expect(state.tasks[0]?.assignee_id).toBe('dev-user')
    }).toPass()

    await expect(page.getByRole('button', { name: 'Remove Taylor Collaborator' })).toHaveCount(0)
  })

  test('non-admin users can view collaborators but not manage them', async ({ page, mockApi }) => {
    await mockApi.prepare({
      me: {
        id: 'u2',
        name: 'Read User',
        email: 'reader@example.com',
        created_at: '2026-01-02T00:00:00Z',
      },
      users: [
        ME,
        {
          id: 'u2',
          name: 'Read User',
          email: 'reader@example.com',
          created_at: '2026-01-02T00:00:00Z',
        },
      ],
      projects: [READ_PROJECT],
      statuses: STATUSES,
      members: [{ project_id: 'p1', user_id: 'u2', role: 'read' }],
      tasks: [],
    })

    await page.goto('/projects/p1?tab=members')

    await expect(page.getByLabel('Members').getByText('Read User', { exact: true })).toBeVisible()
    await expect(page.getByText('Add collaborator')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Save role' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Remove / })).toHaveCount(0)
  })
})
