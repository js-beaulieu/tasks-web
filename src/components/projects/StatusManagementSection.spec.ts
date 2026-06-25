import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const statusesRef = ref([
  { projectId: 'p1', status: 'todo', position: 0 },
  { projectId: 'p1', status: 'in_progress', position: 1 },
])

const createPending = ref(false)
const deletePending = ref(false)
const createMutateAsync = vi.fn<
  (
    input: { projectID: string; status: string },
    opts?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => Promise<void>
>()
const deleteMutateAsync = vi.fn<
  (
    input: { projectID: string; status: string },
    opts?: { onSuccess?: () => void; onError?: (error: Error) => void },
  ) => Promise<void>
>()

vi.mock('@/composables/statuses/useStatuses', () => ({
  useStatuses: () => ({ data: statusesRef }),
}))

vi.mock('@/composables/statuses/useCreateStatus', () => ({
  useCreateStatus: () => ({ mutateAsync: createMutateAsync, isPending: createPending }),
}))

vi.mock('@/composables/statuses/useDeleteStatus', () => ({
  useDeleteStatus: () => ({ mutateAsync: deleteMutateAsync, isPending: deletePending }),
}))

import StatusManagementSection from './StatusManagementSection.vue'

describe('StatusManagementSection', () => {
  beforeEach(() => {
    statusesRef.value = [
      { projectId: 'p1', status: 'todo', position: 0 },
      { projectId: 'p1', status: 'in_progress', position: 1 },
    ]
    createPending.value = false
    deletePending.value = false
    createMutateAsync.mockReset()
    deleteMutateAsync.mockReset()
  })

  it('renders existing statuses with friendly labels', () => {
    const wrapper = mount(StatusManagementSection, {
      props: { projectID: 'p1', canAdmin: true },
    })

    expect(wrapper.text()).toContain('To Do')
    expect(wrapper.text()).toContain('In Progress')
  })

  it('shows duplicate validation before submit', async () => {
    const wrapper = mount(StatusManagementSection, {
      props: { projectID: 'p1', canAdmin: true },
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('input').setValue('todo')

    expect(wrapper.text()).toContain('A status with this value already exists.')
  })

  it('submits a new status', async () => {
    createMutateAsync.mockResolvedValue()
    const wrapper = mount(StatusManagementSection, {
      props: { projectID: 'p1', canAdmin: true },
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('input').setValue('review')
    const addButton = wrapper.findAll('button').find((button) => button.text().trim() === 'Add')
    await addButton!.trigger('click')
    await flushPromises()

    expect(createMutateAsync).toHaveBeenCalledWith(
      { projectID: 'p1', status: 'review' },
      expect.any(Object),
    )
  })

  it('requests deletion for a status', async () => {
    deleteMutateAsync.mockResolvedValue()
    const wrapper = mount(StatusManagementSection, {
      attachTo: document.body,
      props: { projectID: 'p1', canAdmin: true },
    })

    const deleteButtons = wrapper.findAll('button').filter((b) => b.attributes('aria-label')?.includes('Delete status'))
    await deleteButtons[0]!.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Delete status?')
    wrapper.unmount()
  })

  it('renders empty state when no statuses exist', () => {
    statusesRef.value = []
    const wrapper = mount(StatusManagementSection, {
      props: { projectID: 'p1', canAdmin: false },
    })

    expect(wrapper.text()).toContain('No statuses configured.')
  })
})
