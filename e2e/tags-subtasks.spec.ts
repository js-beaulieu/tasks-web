import { test, expect } from '@playwright/test'
import {
  makeTask, setupRoutes,
} from './helpers'

const TAG_TASK = {
  ...makeTask('t1', 'Tagged task', 'todo', 0),
  parent_id: null as string | null,
}

// ─── Tags ───────────────────────────────────────────────────────────────

test.describe('Tags', () => {
  test('displays tags on task card in list view', async ({ page }) => {
    await setupRoutes(page, [TAG_TASK])

    await page.route('*/**/api/tasks/t1/tags', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['urgent', 'backend']) })
      } else {
        await route.continue()
      }
    })

    await page.goto('/projects/p1')

    await expect(page.getByText('urgent')).toBeVisible()
    await expect(page.getByText('backend')).toBeVisible()
  })

  test('adds a tag from task detail', async ({ page }) => {
    await setupRoutes(page, [TAG_TASK])

    let tagAdded: string | null = null
    let currentTags: string[] = []
    await page.route('*/**/api/tasks/t1/tags', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentTags) })
      } else if (method === 'POST') {
        tagAdded = route.request().postDataJSON().tag
        currentTags = [...currentTags, tagAdded!]
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
      } else {
        await route.continue()
      }
    })

    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TAG_TASK) })
    })

    await page.goto('/projects/p1')
    await page.getByText('Tagged task').click()

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('tag-input').fill('important')
    await page.getByTestId('add-tag-btn').click()

    await expect(async () => {
      expect(tagAdded).toBe('important')
    }).toPass({ timeout: 5000 })

    await expect(page.locator('[data-slot="sheet-content"]').getByText('important')).toBeVisible()
  })

  test('strips spaces from tag names before submitting', async ({ page }) => {
    await setupRoutes(page, [TAG_TASK])

    let tagAdded: string | null = null
    await page.route('*/**/api/tasks/t1/tags', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      } else if (method === 'POST') {
        tagAdded = route.request().postDataJSON().tag
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
      } else {
        await route.continue()
      }
    })

    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TAG_TASK) })
    })

    await page.goto('/projects/p1')
    await page.getByText('Tagged task').click()

    await page.getByTestId('tag-input').fill('multi word tag')
    await page.getByTestId('add-tag-btn').click()

    await expect(async () => {
      expect(tagAdded).toBe('multi-word-tag')
    }).toPass({ timeout: 5000 })
  })

  test('removes a tag from task detail', async ({ page }) => {
    await setupRoutes(page, [TAG_TASK])

    let currentTags = ['urgent']
    let deletedTag: string | null = null
    await page.route('*/**/api/tasks/t1/tags', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentTags) })
      } else if (method === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
      } else {
        await route.continue()
      }
    })
    await page.route('*/**/api/tasks/t1/tags/urgent', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedTag = 'urgent'
        currentTags = []
        await route.fulfill({ status: 204 })
      } else {
        await route.continue()
      }
    })

    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TAG_TASK) })
    })

    await page.goto('/projects/p1')
    await page.getByText('Tagged task').click()

    await expect(page.locator('[data-slot="sheet-content"]').getByText('urgent')).toBeVisible()

    await page.getByTestId('remove-tag-urgent').click()

    await expect(async () => {
      expect(deletedTag).toBe('urgent')
    }).toPass({ timeout: 5000 })
  })

  test('tag filter narrows the task list', async ({ page }) => {
    const taskA = { ...makeTask('t1', 'Task A', 'todo', 0) }
    const taskB = { ...makeTask('t2', 'Task B', 'todo', 1) }
    await setupRoutes(page, [taskA, taskB])

    await page.route('*/**/api/tasks/t1/tags', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['urgent']) })
      } else {
        await route.continue()
      }
    })
    await page.route('*/**/api/tasks/t2/tags', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['backend']) })
      } else {
        await route.continue()
      }
    })

    await page.goto('/projects/p1')

    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeVisible()

    await page.getByRole('button', { name: /filter/i }).click()
    await page.locator('label', { hasText: 'urgent' }).click()

    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeHidden()
  })
})

// ─── Subtasks ───────────────────────────────────────────────────────────

const PARENT_TASK = {
  ...makeTask('t1', 'Parent task', 'todo', 0),
  parent_id: null as string | null,
}

test.describe('Subtasks', () => {
  test('displays subtask count badge on task card', async ({ page }) => {
    await setupRoutes(page, [PARENT_TASK])

    const subtask = {
      ...makeTask('s1', 'Sub task', 'todo', 0),
      parent_id: 't1',
    }
    await page.route('*/**/api/tasks/t1/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([subtask]) })
      } else {
        await route.continue()
      }
    })

    await page.goto('/projects/p1')

    await expect(page.locator('[data-task-id="t1"]')).toContainText('1')
  })

  test('creates a subtask from task detail', async ({ page }) => {
    await setupRoutes(page, [PARENT_TASK])

    let createdSubtaskName: string | null = null
    let subtasks: unknown[] = []
    await page.route('*/**/api/tasks/t1/tasks', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subtasks) })
      } else if (method === 'POST') {
        createdSubtaskName = route.request().postDataJSON().name
        const newSub = {
          ...makeTask('s-new', createdSubtaskName!, 'todo', 0),
          parent_id: 't1',
        }
        subtasks = [newSub]
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newSub) })
      } else {
        await route.continue()
      }
    })

    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PARENT_TASK) })
    })

    await page.goto('/projects/p1')
    await page.getByText('Parent task').click()

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('subtask-name-input').fill('New subtask')
    await page.getByTestId('add-subtask-btn').click()

    await expect(async () => {
      expect(createdSubtaskName).toBe('New subtask')
    }).toPass({ timeout: 5000 })

    await expect(async () => {
      await expect(page.locator('[data-slot="sheet-content"]').getByText('New subtask')).toBeVisible()
    }).toPass({ timeout: 5000 })
  })

  test('lists subtasks in task detail', async ({ page }) => {
    await setupRoutes(page, [PARENT_TASK])

    const subtasks = [
      { ...makeTask('s1', 'First sub', 'todo', 0), parent_id: 't1' },
      { ...makeTask('s2', 'Second sub', 'done', 1), parent_id: 't1' },
    ]
    await page.route('*/**/api/tasks/t1/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subtasks) })
      } else {
        await route.continue()
      }
    })

    await page.route('*/**/api/tasks/t1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PARENT_TASK) })
    })

    await page.goto('/projects/p1')
    await page.getByText('Parent task').click()

    await expect(page.locator('[data-slot="sheet-content"]').getByText('First sub')).toBeVisible()
    await expect(page.locator('[data-slot="sheet-content"]').getByText('Second sub')).toBeVisible()
  })

  test('detaches a subtask from its parent', async ({ page }) => {
    const subtaskTask = {
      ...makeTask('t1', 'Sub task', 'todo', 0),
      parent_id: 't-parent' as string | null,
    }
    const parentTask = {
      ...makeTask('t-parent', 'Parent', 'todo', 0),
      parent_id: null as string | null,
    }
    await setupRoutes(page, [parentTask])

    let detachBody: unknown = null
    await page.route('*/**/api/tasks/t1', async (route) => {
      if (route.request().method() === 'PATCH') {
        detachBody = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...subtaskTask, parent_id: null }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subtaskTask) })
      }
    })

    await page.route('*/**/api/tasks/t-parent', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(parentTask) })
    })

    await page.goto('/projects/p1/tasks/t1')

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('detach-subtask').click()

    await expect(async () => {
      expect(detachBody).toEqual({ parent_id: null })
    }).toPass({ timeout: 5000 })
  })
})
