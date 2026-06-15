import { test, expect } from '@playwright/test'
import {
  ME, USERS, PROJECT, STATUSES, MEMBERS,
  makeTask, setupRoutes, enableManualSort, slowDrag, routePatch,
  boxCenter, boxAbove, boxBelow, expectPatchBody,
} from './helpers'

// ─── Task lifecycle ────────────────────────────────────────────────────

test.describe('Task lifecycle', () => {
  test('shows tasks grouped by status', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Buy groceries', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
      { id: 't2', project_id: 'p1', parent_id: null, name: 'Write report', description: 'Q2 report', status: 'in_progress', due_date: '2026-07-01T00:00:00Z', owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T13:00:00Z', updated_at: '2026-06-14T13:00:00Z' },
      { id: 't3', project_id: 'p1', parent_id: null, name: 'Deploy v2', description: null, status: 'done', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T14:00:00Z', updated_at: '2026-06-14T14:00:00Z' },
    ])

    await page.goto('/projects/p1')

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Write report')).toBeVisible()

    await expect(page.locator('button', { hasText: /To Do/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /In Progress/ })).toBeVisible()
  })

  test('can switch between list and board view', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Test task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
    ])

    await page.goto('/projects/p1')
    await expect(page.getByText('Test task')).toBeVisible()

    await page.getByRole('button', { name: /board/i }).click()
    await expect(page.locator('[class*="rounded-lg border"]').first()).toContainText('To Do')
  })

  test('opens task detail sheet when clicking a task', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Review PR', description: 'Check the changes', status: 'todo', due_date: '2026-07-01T00:00:00Z', owner_id: 'dev-user', assignee_id: 'dev-user', position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
    ])
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
    await page.route('*/**/api/users/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ME) }),
    )
    await page.route('*/**/api/users?ids=*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USERS) }),
    )
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

  test('task cards render in list view', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Visible task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
    ])

    await page.goto('/projects/p1')

    const todoGroup = page.locator('button', { hasText: /To Do/ })
    await expect(todoGroup).toBeVisible()
    await expect(page.getByText('Visible task')).toBeVisible()
    await expect(todoGroup).toContainText('1')
  })

  test('task cards render in board view', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Board task', description: null, status: 'todo', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
    ])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    await expect(page.getByText('Board task')).toBeVisible()
  })

  test('quick-add Add button enables and disables based on input', async ({ page }) => {
    await setupRoutes(page, [])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /add task/i }).first().click()

    const addButton = page.getByRole('button', { name: /^add$/i })
    await expect(addButton).toBeDisabled()

    await page.getByPlaceholder('Task name…').fill('My task')
    await expect(addButton).toBeEnabled()

    await page.getByPlaceholder('Task name…').fill('')
    await expect(addButton).toBeDisabled()
  })

  test('board view collapsed columns expand with tasks, not Add task button', async ({ page }) => {
    await setupRoutes(page, [
      { id: 't1', project_id: 'p1', parent_id: null, name: 'Done task', description: null, status: 'done', due_date: null, owner_id: 'dev-user', assignee_id: null, position: 0, recurrence: null, created_at: '2026-06-14T12:00:00Z', updated_at: '2026-06-14T12:00:00Z' },
    ])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    await expect(page.locator('button', { hasText: /^Done/ })).toBeVisible()

    const expandButton = page.getByRole('button', { name: /Expand/ })
    if (await expandButton.isVisible()) {
      await expandButton.click()
    }

    await expect(page.getByText('Done task')).toBeVisible()
    await expect(page.getByText('Expand (0)')).toBeHidden()
  })

  test('drag handles are visible when sort is Manual', async ({ page }) => {
    await setupRoutes(page, [
      makeTask('t1', 'Task A', 'todo', 100),
      makeTask('t2', 'Task B', 'todo', 200),
    ])

    await page.goto('/projects/p1')
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(2)

    await page.getByRole('button', { name: /board/i }).click()
    await expect(page.locator('.drag-handle').first()).toBeVisible()
  })

  test('drag handles are hidden when sort is not Manual', async ({ page }) => {
    await setupRoutes(page, [
      makeTask('t1', 'Sorted task', 'todo', 0),
    ])

    await page.goto('/projects/p1')

    await page.getByRole('button', { name: /manual/i }).click()
    await page.getByRole('menuitem', { name: /due date/i }).click()

    await expect(page.locator('.drag-handle')).toHaveCount(0)
  })

  test('reorder in list view renders tasks with data-status', async ({ page }) => {
    await setupRoutes(page, [
      makeTask('t1', 'Task A', 'todo', 0),
      makeTask('t2', 'Task B', 'todo', 1),
      makeTask('t3', 'Task C', 'todo', 2),
    ])

    await page.goto('/projects/p1')

    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeVisible()
    await expect(page.getByText('Task C')).toBeVisible()
  })
})

// ─── Board: same-column reorder ─────────────────────────────────────────

test.describe('Board: same-column reorder', () => {
  test('drag last item above first (C→above A) → pos 0', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't3', tasks[2])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleC = page.locator('[data-task-id="t3"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleC).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleC.boundingBox())!),
      boxAbove((await cardA.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })

  test('drag first item below last (A→below C) → pos 2', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardC = page.locator('[data-task-id="t3"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxBelow((await cardC.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(2)
    })
  })

  test('drag middle item above first (B→above A) → pos 0', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't2', tasks[1])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleB = page.locator('[data-task-id="t2"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleB).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleB.boundingBox())!),
      boxAbove((await cardA.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })

  test('drag first item below second in 2-item list (A→below B) → pos 1', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxBelow((await cardB.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })

  test('drag item between two others (C→between A and B) → pos 1', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't3', tasks[2])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleC = page.locator('[data-task-id="t3"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleC).toBeVisible()

    const bC = await handleC.boundingBox()
    const bA = await cardA.boundingBox()
    const bB = await cardB.boundingBox()
    expect(bC).toBeTruthy()
    expect(bA).toBeTruthy()
    expect(bB).toBeTruthy()

    const targetY = ((bA!.y + bA!.height) + bB!.y) / 2

    await slowDrag(page,
      { x: bC!.x + bC!.width / 2, y: bC!.y + bC!.height / 2 },
      { x: bA!.x + bA!.width / 2, y: targetY },
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })
})

// ─── Board: cross-column moves ───────────────────────────────────────────

test.describe('Board: cross-column moves', () => {
  test('move task to empty column → pos 0', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const ipColumn = page.locator('[data-status="in_progress"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxCenter((await ipColumn.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(0)
    })
  })

  test('move task above existing in target column → pos 0', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'in_progress', 200)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxAbove((await cardB.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(0)
    })
  })

  test('move task below existing in target column → pos 1', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'in_progress', 200)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxBelow((await cardB.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(1)
    })
  })

  test('move task between two in target column → pos 1', async ({ page }) => {
    const tasks = [
      makeTask('t1', 'A', 'todo', 100),
      makeTask('t2', 'B', 'in_progress', 200),
      makeTask('t3', 'C', 'in_progress', 300),
    ]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    const cardC = page.locator('[data-task-id="t3"]')
    await expect(handleA).toBeVisible()

    const bA = await handleA.boundingBox()
    const bB = await cardB.boundingBox()
    const bC = await cardC.boundingBox()
    expect(bA).toBeTruthy()
    expect(bB).toBeTruthy()
    expect(bC).toBeTruthy()

    const targetY = ((bB!.y + bB!.height) + bC!.y) / 2

    await slowDrag(page,
      { x: bA!.x + bA!.width / 2, y: bA!.y + bA!.height / 2 },
      { x: bB!.x + bB!.width / 2, y: targetY },
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(1)
    })
  })

  test('drag task to done column sends PATCH with done status', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const doneColumn = page.locator('[data-status="done"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxCenter((await doneColumn.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('done')
    })
  })
})

// ─── List: same-group reorder ────────────────────────────────────────────

test.describe('List: same-group reorder', () => {
  test('drag item down within group (A→below B) → pos 1', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /list/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleA.boundingBox())!),
      boxBelow((await cardB.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })

  test('drag item up within group (B→above A) → pos 0', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't2', tasks[1])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /list/i }).click()
    await enableManualSort(page)

    const handleB = page.locator('[data-task-id="t2"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleB).toBeVisible()

    await slowDrag(page,
      boxCenter((await handleB.boundingBox())!),
      boxAbove((await cardA.boundingBox())!),
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })
})

// ─── Menu-based movement ────────────────────────────────────────────────

test.describe('Menu-based movement', () => {
  test('move task to another status via dropdown in list view', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click({ force: true })
    await page.getByRole('menuitem', { name: /move to in progress/i }).click()

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
    })
  })

  test('move task to another status via dropdown in board view', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await setupRoutes(page, tasks)
    const { getPatchBody } = await routePatch(page, 't1', tasks[0])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click({ force: true })
    await page.getByRole('menuitem', { name: /move to in progress/i }).click()

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
    })
  })

  test('move task to done via dropdown calls complete endpoint', async ({ page }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await setupRoutes(page, tasks)

    let completeCalled = false
    await page.route('*/**/api/tasks/t1/complete', async (route) => {
      if (route.request().method() === 'POST') {
        completeCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ completed: makeTask('t1', 'A', 'done', 100), next: null }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/projects/p1')

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click({ force: true })
    await page.getByRole('menuitem', { name: /move to done/i }).click()

    await expect(async () => {
      expect(completeCalled).toBe(true)
    }).toPass({ timeout: 5000 })
  })
})

// ─── Drag handle visibility ──────────────────────────────────────────────

test.describe('Drag handle visibility', () => {
  test('drag handle appears in manual sort mode and hides in due date mode', async ({ page }) => {
    await setupRoutes(page, [makeTask('t1', 'A', 'todo', 100)])

    await page.goto('/projects/p1')
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(1)

    await page.getByRole('button', { name: /manual/i }).click()
    await page.getByRole('menuitem', { name: /due date/i }).click()

    await expect(page.locator('.drag-handle')).toHaveCount(0)
  })

  test('drag handle appears in board view when sort is manual', async ({ page }) => {
    await setupRoutes(page, [makeTask('t1', 'A', 'todo', 100)])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(1)
  })
})