import { computed, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addMutate =
  vi.fn<
    (
      input: { projectID: string; input: { userId: string; role: 'read' | 'modify' | 'admin' } },
      opts?: { onSuccess?: () => void },
    ) => void
  >()

const addPending = ref(false)
const searchResults = ref([
  { id: 'u1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', name: 'Bob', email: 'bob@example.com', createdAt: '2026-01-01T00:00:00Z' },
])
const isSearching = ref(false)
const isSearchError = ref(false)

vi.mock('@/composables/members/useAddProjectMember', () => ({
  useAddProjectMember: () => ({ mutate: addMutate, isPending: addPending }),
}))

vi.mock('@/composables/members/useUserSearch', () => ({
  useUserSearch: () => ({ data: searchResults, isFetching: isSearching, isError: isSearchError }),
}))

vi.mock('@/composables/_ui/useDebouncedValue', () => ({
  useDebouncedValue: (source: ReturnType<typeof computed>) => ({
    debounced: source,
    isDebouncing: ref(false),
  }),
}))

import MemberAddCard from './MemberAddCard.vue'

describe('MemberAddCard', () => {
  beforeEach(() => {
    addMutate.mockReset()
    addPending.value = false
    searchResults.value = [
      { id: 'u1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'u2', name: 'Bob', email: 'bob@example.com', createdAt: '2026-01-01T00:00:00Z' },
    ]
    isSearching.value = false
    isSearchError.value = false
  })

  it('shows short-query guidance before 2 chars', async () => {
    const wrapper = mount(MemberAddCard, {
      props: { projectID: 'p1', existingMemberIds: new Set<string>() },
    })

    await wrapper.get('input').setValue('a')

    expect(wrapper.text()).toContain('Type at least 2 characters to search.')
  })

  it('filters out existing members from search results', async () => {
    const wrapper = mount(MemberAddCard, {
      props: { projectID: 'p1', existingMemberIds: new Set<string>(['u1']) },
    })

    await wrapper.get('input').setValue('al')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('shows search error state', async () => {
    isSearchError.value = true
    const wrapper = mount(MemberAddCard, {
      props: { projectID: 'p1', existingMemberIds: new Set<string>() },
    })

    await wrapper.get('input').setValue('al')
    await flushPromises()

    expect(wrapper.text()).toContain('Could not search users right now.')
  })

  it('calls add collaborator mutation and emits added on success', async () => {
    addMutate.mockImplementation((_input, opts) => {
      opts?.onSuccess?.()
    })

    const wrapper = mount(MemberAddCard, {
      props: { projectID: 'p1', existingMemberIds: new Set<string>() },
    })

    await wrapper.get('input').setValue('al')
    await flushPromises()

    await wrapper.get('button').trigger('click')

    expect(addMutate).toHaveBeenCalledWith(
      { projectID: 'p1', input: { userId: 'u1', role: 'read' } },
      expect.any(Object),
    )
    expect(wrapper.emitted('added')).toBeTruthy()
  })
})
