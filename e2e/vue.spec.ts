import { test, expect } from '@playwright/test'

test('loads the shell with a seeded current user', async ({ page }) => {
  await page.route('*/**/api/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'dev-user',
        name: 'Dev User',
        email: 'dev@example.com',
        created_at: '2026-01-01T00:00:00Z',
      }),
    })
  })

  await page.goto('/')

  await expect(page.locator('header')).toContainText('Tasks')
  await expect(page.locator('header')).toContainText('Dev User')
  await expect(page.locator('header')).toContainText('dev@example.com')
})
