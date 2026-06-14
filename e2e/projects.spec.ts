import { test, expect } from '@playwright/test'

function mockCurrentUser(route: Parameters<Parameters<typeof test>[1]>[0]['route']) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 'dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
      created_at: '2026-01-01T00:00:00Z',
    }),
  })
}

function mockUsersByID(route: Parameters<Parameters<typeof test>[1]>[0]['route']) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'dev-user',
        name: 'Dev User',
        email: 'dev@example.com',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]),
  })
}

test('project list shows owner name', async ({ page }) => {
  await page.route('*/**/api/users/me', mockCurrentUser)

  await page.route('*/**/api/projects', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'p1',
          name: 'Demo Project',
          owner_id: 'dev-user',
          created_at: '2026-06-14T15:50:19.34566-04:00',
          updated_at: '2026-06-14T15:50:19.34566-04:00',
        },
      ]),
    })
  })

  await page.route('*/**/api/users?ids=*', mockUsersByID)

  await page.goto('/')

  const projectCard = page.getByRole('link', { name: /Demo Project/ })
  await expect(projectCard).toBeVisible()
  await expect(projectCard).toContainText('Dev User')
  await expect(projectCard).not.toContainText('Unknown')
})

test('creates a new project', async ({ page }) => {
  await page.route('*/**/api/users/me', mockCurrentUser)
  await page.route('*/**/api/users?ids=*', mockUsersByID)

  let listCalls = 0
  await page.route('*/**/api/projects', async (route) => {
    if (route.request().method() === 'POST') {
      const body = await route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'p-new',
          name: body.name,
          description: body.description,
          owner_id: 'dev-user',
          created_at: '2026-06-14T18:00:00.000000-04:00',
          updated_at: '2026-06-14T18:00:00.000000-04:00',
        }),
      })
      return
    }

    listCalls++
    const projects =
      listCalls === 1
        ? []
        : [
            {
              id: 'p-new',
              name: 'New Project',
              description: 'A new project',
              owner_id: 'dev-user',
              created_at: '2026-06-14T18:00:00.000000-04:00',
              updated_at: '2026-06-14T18:00:00.000000-04:00',
            },
          ]

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    })
  })

  await page.route('*/**/api/projects/p-new', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'p-new',
        name: 'New Project',
        description: 'A new project',
        owner_id: 'dev-user',
        created_at: '2026-06-14T18:00:00.000000-04:00',
        updated_at: '2026-06-14T18:00:00.000000-04:00',
      }),
    })
  })

  await page.goto('/')

  await expect(page.locator('text=No projects yet')).toBeVisible()

  await page.getByRole('button', { name: 'New project' }).first().click()
  await page.getByLabel('Name').fill('New Project')
  await page.getByLabel('Description').fill('A new project')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page).toHaveURL('/projects/p-new')
  await expect(page.locator('h1')).toContainText('New Project')
})
