import { test, expect } from './msw'
import { makeTask, openTaskDetail, seedMockApi } from './helpers'

const TAG_TASK = makeTask('t1', 'Tagged task', 'todo', 0)

test.describe('Tags', () => {
  test('displays tags on task card in list view', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [TAG_TASK], { taskTags: { t1: ['urgent', 'backend'] } })
    await page.goto('/projects/p1')

    await expect(page.getByText('urgent')).toBeVisible()
    await expect(page.getByText('backend')).toBeVisible()
  })

  test('adds a tag from task detail', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [TAG_TASK])

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('tag-input').fill('important')
    await page.getByTestId('add-tag-btn').click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      const tagRequest = [...requests].reverse().find(
        (request) => request.method === 'POST' && request.pathname.endsWith('/tasks/t1/tags'),
      )
      expect(tagRequest?.body).toEqual({ tag: 'important' })
    }).toPass({ timeout: 5000 })

    await expect(page.locator('[data-slot="sheet-content"]').getByText('important')).toBeVisible()
  })

  test('strips spaces from tag names before submitting', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [TAG_TASK])

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await page.getByTestId('tag-input').fill('multi word tag')
    await page.getByTestId('add-tag-btn').click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      const tagRequest = [...requests].reverse().find(
        (request) => request.method === 'POST' && request.pathname.endsWith('/tasks/t1/tags'),
      )
      expect(tagRequest?.body).toEqual({ tag: 'multi-word-tag' })
    }).toPass({ timeout: 5000 })
  })

  test('removes a tag from task detail', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [TAG_TASK], { taskTags: { t1: ['urgent'] } })

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]').getByText('urgent')).toBeVisible()

    await page.getByTestId('remove-tag-urgent').click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      expect(
        requests.some(
          (request) => request.method === 'DELETE' && request.pathname.endsWith('/tasks/t1/tags/urgent'),
        ),
      ).toBe(true)
    }).toPass({ timeout: 5000 })
  })

  test('tag filter narrows the task list', async ({ page, mockApi }) => {
    const taskA = makeTask('t1', 'Task A', 'todo', 0)
    const taskB = makeTask('t2', 'Task B', 'todo', 1)
    await seedMockApi(mockApi, [taskA, taskB], { taskTags: { t1: ['urgent'], t2: ['backend'] } })

    await page.goto('/projects/p1')

    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeVisible()

    await page.getByRole('button', { name: /filter/i }).click()
    await page.locator('label', { hasText: 'urgent' }).click()

    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeHidden()
  })
})

const PARENT_TASK = makeTask('t1', 'Parent task', 'todo', 0)

test.describe('Subtasks', () => {
  test('displays subtask count badge on task card', async ({ page, mockApi }) => {
    const subtask = { ...makeTask('s1', 'Sub task', 'todo', 0), parent_id: 't1' }
    await seedMockApi(mockApi, [PARENT_TASK, subtask])

    await page.goto('/projects/p1')

    await expect(page.locator('[data-task-id="t1"]')).toContainText('1')
  })

  test('creates a subtask from task detail', async ({ page, mockApi }) => {
    await seedMockApi(mockApi, [PARENT_TASK], { nextTaskID: 's-new' })

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('subtask-name-input').fill('New subtask')
    await page.getByTestId('add-subtask-btn').click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      const createRequest = [...requests].reverse().find(
        (request) => request.method === 'POST' && request.pathname.endsWith('/tasks/t1/tasks'),
      )
      expect(createRequest?.body).toEqual({ name: 'New subtask', status: 'todo' })
    }).toPass({ timeout: 5000 })

    await expect(async () => {
      await expect(page.locator('[data-slot="sheet-content"]').getByText('New subtask')).toBeVisible()
    }).toPass({ timeout: 5000 })
  })

  test('lists subtasks in task detail', async ({ page, mockApi }) => {
    const subtasks = [
      { ...makeTask('s1', 'First sub', 'todo', 0), parent_id: 't1' },
      { ...makeTask('s2', 'Second sub', 'done', 1), parent_id: 't1' },
    ]
    await seedMockApi(mockApi, [PARENT_TASK, ...subtasks])

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]').getByText('First sub')).toBeVisible()
    await expect(page.locator('[data-slot="sheet-content"]').getByText('Second sub')).toBeVisible()
  })

  test('detaches a subtask from its parent', async ({ page, mockApi }) => {
    const subtaskTask = { ...makeTask('t1', 'Sub task', 'todo', 0), parent_id: 't-parent' }
    const parentTask = makeTask('t-parent', 'Parent', 'todo', 0)
    await seedMockApi(mockApi, [parentTask, subtaskTask])

    await page.goto('/projects/p1')
    await openTaskDetail(page, 't1')

    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible()

    await page.getByTestId('detach-subtask').click()

    await expect(async () => {
      const requests = await mockApi.getRequestLog()
      const detachRequest = [...requests].reverse().find(
        (request) => request.method === 'PATCH' && request.pathname.endsWith('/tasks/t1'),
      )
      expect(detachRequest?.body).toEqual({ parent_id: null })
    }).toPass({ timeout: 5000 })
  })
})
