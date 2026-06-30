import { test, expect } from './msw'
import { ME, USERS, PROJECT } from './helpers'

test('project list shows owner name', async ({ page, mockApi }) => {
  await mockApi.prepare({
    me: ME,
    users: USERS,
    projects: [
      {
        id: 'p1',
        name: 'Demo Project',
        owner_id: 'dev-user',
        effective_role: 'admin',
        created_at: '2026-06-14T15:50:19.34566-04:00',
        updated_at: '2026-06-14T15:50:19.34566-04:00',
      },
    ],
  })

  await page.goto('/')

  const projectCard = page.getByRole('link', { name: /Demo Project/ })
  await expect(projectCard).toBeVisible()
  await expect(projectCard).toContainText('Dev User')
  await expect(projectCard).not.toContainText('Unknown')
})

test('creates a new project', async ({ page, mockApi }) => {
  await mockApi.prepare({
    me: ME,
    users: USERS,
    projects: [],
    statuses: [],
    members: [],
    tasks: [],
    nextProjectID: 'p-new',
  })

  await page.goto('/')

  await expect(page.locator('text=No projects yet')).toBeVisible()

  await page.getByRole('button', { name: 'New project' }).first().click()
  await page.getByLabel('Name').fill('New Project')
  await page.getByLabel('Description').fill('A new project')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page).toHaveURL('/projects/p-new')
  await expect(page.locator('h1')).toContainText('New Project')

  const state = await mockApi.getState()
  expect(state.projects.some((project) => project.id === 'p-new' && project.name === 'New Project')).toBe(true)
  expect(state.projects.find((project) => project.id === 'p-new')?.description).toBe('A new project')
  expect(state.members.some((member) => member.project_id === 'p-new' && member.user_id === PROJECT.owner_id)).toBe(false)
})
