import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { makeApiProject, makeApiProjectMember, makeApiTask } from '@/test/mocks/fixtures'
import { getLastRequest, getMockData, seedMockData } from '@/test/mocks/state'
import { mountWithQuery } from '@/test/mountWithQuery'
import { useAddProjectMember } from './useAddProjectMember'
import { useRemoveProjectMember } from './useRemoveProjectMember'
import { useUpdateProjectMember } from './useUpdateProjectMember'

describe('project member mutations', () => {
  beforeEach(() => {
    seedMockData({
      projects: [makeApiProject({ id: 'p1', owner_id: 'dev-user' })],
      members: [makeApiProjectMember({ project_id: 'p1', user_id: 'u2', role: 'read' })],
      users: [
        { id: 'dev-user', name: 'Dev User', email: 'dev@example.com', created_at: '2026-01-01T00:00:00Z' },
        { id: 'u2', name: 'Member User', email: 'member@example.com', created_at: '2026-01-02T00:00:00Z' },
        { id: 'u3', name: 'New User', email: 'new@example.com', created_at: '2026-01-03T00:00:00Z' },
      ],
      tasks: [
        makeApiTask({
          id: 't1',
          project_id: 'p1',
          owner_id: 'dev-user',
          assignee_id: 'u2',
        }),
      ],
    })
  })

  it('adds a collaborator', async () => {
    let addMember: ReturnType<typeof useAddProjectMember>

    const TestComponent = defineComponent({
      setup() {
        addMember = useAddProjectMember()
        return { addMember }
      },
      render() {
        return h('div')
      },
    })

    mountWithQuery(TestComponent)

    addMember!.mutate({ projectID: 'p1', input: { userId: 'u3', role: 'modify' } })

    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members'))
    expect(getLastRequest()?.body).toEqual({ user_id: 'u3', role: 'modify' })
    await vi.waitFor(() => {
      expect(getMockData().members).toEqual([
        { project_id: 'p1', user_id: 'u2', role: 'read' },
        { project_id: 'p1', user_id: 'u3', role: 'modify' },
      ])
    })
  })

  it('updates a collaborator role', async () => {
    let updateMember: ReturnType<typeof useUpdateProjectMember>

    const TestComponent = defineComponent({
      setup() {
        updateMember = useUpdateProjectMember()
        return { updateMember }
      },
      render() {
        return h('div')
      },
    })

    mountWithQuery(TestComponent)

    updateMember!.mutate({ projectID: 'p1', userID: 'u2', role: 'admin' })

    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members/u2'))
    expect(getLastRequest()?.body).toEqual({ role: 'admin' })
    await vi.waitFor(() => {
      expect(getMockData().members).toEqual([
        { project_id: 'p1', user_id: 'u2', role: 'admin' },
      ])
    })
  })

  it('removes a collaborator and reassigns their tasks to the owner', async () => {
    let removeMember: ReturnType<typeof useRemoveProjectMember>

    const TestComponent = defineComponent({
      setup() {
        removeMember = useRemoveProjectMember()
        return { removeMember }
      },
      render() {
        return h('div')
      },
    })

    mountWithQuery(TestComponent)

    removeMember!.mutate({ projectID: 'p1', userID: 'u2' })

    await vi.waitFor(() => expect(getLastRequest()?.pathname).toBe('/tasks/projects/p1/members/u2'))
    await vi.waitFor(() => {
      expect(getMockData().members).toEqual([])
      expect(getMockData().tasks[0]?.assignee_id).toBe('dev-user')
    })
  })
})
