import { test, expect } from './msw'
import {
  makeTask,
  seedMockApi,
  enableManualSort,
  slowDrag,
  routePatch,
  openTaskDetail,
  boxCenter,
  boxAbove,
  boxBelow,
  expectPatchBody,
} from './helpers'
import { makeApiProject, makeApiProjectMember, makeApiProjectStatus } from '../src/test/mocks/fixtures'

test.describe('Task lifecycle', () => {
  test('shows tasks grouped by status', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [
      makeTask('t1', 'Buy groceries', 'todo', 0),
      {
        ...makeTask('t2', 'Write report', 'in_progress', 0),
        description: 'Q2 report',
        due_date: '2026-07-01T00:00:00Z',
        assignee_id: 'dev-user',
      },
      makeTask('t3', 'Deploy v2', 'done', 0),
    ])

    await page.goto('/projects/p1')

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Write report')).toBeVisible()

    await expect(page.locator('button', { hasText: /To Do/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /In Progress/ })).toBeVisible()
  })

  test('can switch between list and board view', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Test task', 'todo', 0)])

    await page.goto('/projects/p1')
    await expect(page.getByText('Test task')).toBeVisible()

    await page.getByRole('button', { name: /board/i }).click()
    await expect(page.locator('[class*="rounded-lg border"]').first()).toContainText('To Do')
  })

  test('opens task detail sheet when clicking a task', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [
      {
        ...makeTask('t1', 'Review PR', 'todo', 0),
        description: 'Check the changes',
        due_date: '2026-07-01T00:00:00Z',
        assignee_id: 'dev-user',
      },
    ])

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Review PR')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Check the changes')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('To Do')
    await expect(page.locator('[data-slot="sheet-content"]')).toContainText('Dev User')
  })

  test('moves a task to another project from task detail', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Move me', 'todo', 0)], {
      projects: [
        makeApiProject({ id: 'p1', name: 'Source Project', owner_id: 'dev-user', effective_role: 'admin' }),
        makeApiProject({ id: 'p2', name: 'Target Project', owner_id: 'target-owner', effective_role: 'modify' }),
      ],
      members: [
        makeApiProjectMember({ project_id: 'p1', user_id: 'dev-user', role: 'admin' }),
        makeApiProjectMember({ project_id: 'p2', user_id: 'dev-user', role: 'modify' }),
      ],
      statuses: [
        makeApiProjectStatus({ project_id: 'p1', status: 'todo', position: 0 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'in_progress', position: 1 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'done', position: 2 }),
        makeApiProjectStatus({ project_id: 'p1', status: 'cancelled', position: 3 }),
        makeApiProjectStatus({ project_id: 'p2', status: 'todo', position: 0 }),
        makeApiProjectStatus({ project_id: 'p2', status: 'in_progress', position: 1 }),
        makeApiProjectStatus({ project_id: 'p2', status: 'done', position: 2 }),
        makeApiProjectStatus({ project_id: 'p2', status: 'cancelled', position: 3 }),
      ],
    })
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')
    const taskDialog = page.getByRole('dialog', { name: 'Task Details' })

    await page.getByRole('button', { name: /^edit$/i }).click()
    await taskDialog.getByRole('combobox').nth(0).click()
    await page.getByRole('option', { name: 'Target Project' }).click()
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page.getByText('Move task to another project?')).toBeVisible()
    await page.getByRole('button', { name: /move task/i }).click()

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.project_id).toBe('p2')
    })
    await expect(page.getByText('Task moved')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open task' })).toBeVisible()
    await expect(page.locator('[data-slot="sheet-content"]')).toBeHidden()
    await expect(page.getByText('Move me')).toBeHidden()
  })

  test('can quick-add a task in a status group', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [])

    await page.goto('/projects/p1')

    await page.getByRole('button', { name: /add task/i }).first().click()
    await page.getByPlaceholder('Task name…').fill('New task')
    await page.getByRole('button', { name: /^add$/i }).click()

    await expect(page.getByText('New task')).toBeVisible()
  })

  test('task cards render in list view', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Visible task', 'todo', 0)])

    await page.goto('/projects/p1')

    const todoGroup = page.locator('button', { hasText: /To Do/ })
    await expect(todoGroup).toBeVisible()
    await expect(page.getByText('Visible task')).toBeVisible()
    await expect(todoGroup).toContainText('1')
  })

  test('task cards render in board view', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Board task', 'todo', 0)])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    await expect(page.getByText('Board task')).toBeVisible()
  })

  test('quick-add Add button enables and disables based on input', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /add task/i }).first().click()

    const addButton = page.getByRole('button', { name: /^add$/i })
    await expect(addButton).toBeDisabled()

    await page.getByPlaceholder('Task name…').fill('My task')
    await expect(addButton).toBeEnabled()

    await page.getByPlaceholder('Task name…').fill('')
    await expect(addButton).toBeDisabled()
  })

  test('board view collapsed columns expand with tasks, not Add task button', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Done task', 'done', 0)])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    await expect(page.locator('button', { hasText: /^Done/ })).toBeVisible()

    await page.getByText('Expand (1)').click()

    await expect(page.getByText('Done task')).toBeVisible()
    await expect(page.getByText('Expand (1)')).toBeHidden()
  })

  test('drag handles are visible when sort is Manual', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Task A', 'todo', 100), makeTask('t2', 'Task B', 'todo', 200)])

    await page.goto('/projects/p1')
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(2)

    await page.getByRole('button', { name: /board/i }).click()
    await expect(page.locator('.drag-handle').first()).toBeVisible()
  })

  test('drag handles are hidden when sort is not Manual', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'Sorted task', 'todo', 0)])

    await page.goto('/projects/p1')

    await page.getByRole('button', { name: /manual/i }).click()
    await page.getByRole('menuitem', { name: /due date/i }).click()

    await expect(page.locator('.drag-handle')).toHaveCount(0)
  })

  test('reorder in list view renders tasks with data-status', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [
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

test.describe('Board: same-column reorder', () => {
  test('drag last item above first (C→above A) → pos 0', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't3')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleC = page.locator('[data-task-id="t3"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleC).toBeVisible()

    await slowDrag(page, boxCenter((await handleC.boundingBox())!), boxAbove((await cardA.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })

  test('drag first item below last (A→below C) → pos 2', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardC = page.locator('[data-task-id="t3"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxBelow((await cardC.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(2)
    })
  })

  test('drag middle item above first (B→above A) → pos 0', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't2')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleB = page.locator('[data-task-id="t2"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleB).toBeVisible()

    await slowDrag(page, boxCenter((await handleB.boundingBox())!), boxAbove((await cardA.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })

  test('drag first item below second in 2-item list (A→below B) → pos 1', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxBelow((await cardB.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })

  test('drag item between two others (C→between A and B) → pos 1', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200), makeTask('t3', 'C', 'todo', 300)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't3')

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

    await slowDrag(
      page,
      { x: bC!.x + bC!.width / 2, y: bC!.y + bC!.height / 2 },
      { x: bA!.x + bA!.width / 2, y: targetY },
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })
})

test.describe('Board: cross-column moves', () => {
  test('move task to empty column → pos 0', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const ipColumn = page.locator('[data-status="in_progress"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxCenter((await ipColumn.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(0)
    })
  })

  test('move task above existing in target column → pos 0', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'in_progress', 200)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxAbove((await cardB.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(0)
    })
  })

  test('move task below existing in target column → pos 1', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'in_progress', 200)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxBelow((await cardB.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(1)
    })
  })

  test('move task between two in target column → pos 1', async ({ page, mockApi }) => {
    const tasks = [
      makeTask('t1', 'A', 'todo', 100),
      makeTask('t2', 'B', 'in_progress', 200),
      makeTask('t3', 'C', 'in_progress', 300),
    ]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

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

    await slowDrag(
      page,
      { x: bA!.x + bA!.width / 2, y: bA!.y + bA!.height / 2 },
      { x: bB!.x + bB!.width / 2, y: targetY },
    )

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
      expect(body.position).toBe(1)
    })
  })

  test('drag task to done column sends PATCH with done status', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    await expect(handleA).toBeVisible()

    await page.locator('button', { hasText: /^Done/ }).click()

    const doneColumn = page.locator('[data-status="done"]')
    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxCenter((await doneColumn.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('done')
    })
  })
})

test.describe('List: same-group reorder', () => {
  test('drag item down within group (A→below B) → pos 1', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /list/i }).click()
    await enableManualSort(page)

    const handleA = page.locator('[data-task-id="t1"] .drag-handle')
    const cardB = page.locator('[data-task-id="t2"]')
    await expect(handleA).toBeVisible()

    await slowDrag(page, boxCenter((await handleA.boundingBox())!), boxBelow((await cardB.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(1)
    })
  })

  test('drag item up within group (B→above A) → pos 0', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100), makeTask('t2', 'B', 'todo', 200)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't2')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /list/i }).click()
    await enableManualSort(page)

    const handleB = page.locator('[data-task-id="t2"] .drag-handle')
    const cardA = page.locator('[data-task-id="t1"]')
    await expect(handleB).toBeVisible()

    await slowDrag(page, boxCenter((await handleB.boundingBox())!), boxAbove((await cardA.boundingBox())!))

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.position).toBe(0)
    })
  })
})

test.describe('Menu-based movement', () => {
  test('move task to another status via dropdown in list view', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click()
    await page.getByRole('menuitem', { name: /move to in progress/i }).click()

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
    })
  })

  test('move task to another status via dropdown in board view', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await seedMockApi(mockApi, tasks)
    const { getPatchBody } = routePatch(mockApi, 't1')

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click()
    await page.getByRole('menuitem', { name: /move to in progress/i }).click()

    await expectPatchBody(getPatchBody, (body) => {
      expect(body.status).toBe('in_progress')
    })
  })

  test('move task to done via dropdown calls complete endpoint', async ({ page, mockApi }) => {
    const tasks = [makeTask('t1', 'A', 'todo', 100)]
    await seedMockApi(mockApi, tasks)

    await page.goto('/projects/p1')

    const taskCard = page.locator('[data-task-id="t1"]')
    await expect(taskCard).toBeVisible()
    await taskCard.locator('[data-slot="dropdown-menu-trigger"]').click()
    await page.getByRole('menuitem', { name: /move to done/i }).click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      expect(
        requests.some(
          (request) => request.method === 'POST' && request.pathname.endsWith('/tasks/t1/complete'),
        ),
      ).toBe(true)
    }).toPass({ timeout: 5000 })
  })
})

test.describe('Drag handle visibility', () => {
  test('drag handle appears in manual sort mode and hides in due date mode', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'A', 'todo', 100)])

    await page.goto('/projects/p1')
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(1)

    await page.getByRole('button', { name: /manual/i }).click()
    await page.getByRole('menuitem', { name: /due date/i }).click()

    await expect(page.locator('.drag-handle')).toHaveCount(0)
  })

  test('drag handle appears in board view when sort is manual', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [makeTask('t1', 'A', 'todo', 100)])

    await page.goto('/projects/p1')
    await page.getByRole('button', { name: /board/i }).click()
    await enableManualSort(page)

    await expect(page.locator('.drag-handle')).toHaveCount(1)
  })
})
