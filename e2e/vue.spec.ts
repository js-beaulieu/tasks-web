import { test, expect } from '@playwright/test'

test('loads the shell with a seeded current user', async ({ page }) => {
  await page.route(/\/(tasks|api)\/users\/me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'dev-user',
        name: 'Dev User',
        email: 'dev@example.com',
        preferredIdentity: 'dev',
      }),
    })
  })

  await page.goto('/')

  await expect(page.locator('header')).toContainText('Tasks')
  await expect(page.locator('main')).toContainText('Dev User')
  await expect(page.locator('main')).toContainText('dev@example.com')
})
