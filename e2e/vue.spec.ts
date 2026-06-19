import { test, expect } from './msw'
import { ME } from './helpers'

test('loads the shell with a seeded current user', async ({ page, mockApi }) => {
  await mockApi.prepare({
    me: ME,
    users: [ME],
  })

  await page.goto('/')

  await expect(page.locator('header')).toContainText('Tasks')
  await expect(page.locator('header')).toContainText('Dev User')
  await expect(page.locator('header')).toContainText('dev@example.com')
})
