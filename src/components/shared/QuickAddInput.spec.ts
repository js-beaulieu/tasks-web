import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import QuickAddInput from '@/components/shared/QuickAddInput.vue'

describe('QuickAddInput', () => {
  it('shows the toggle button by default', () => {
    const wrapper = mount(QuickAddInput)
    expect(wrapper.text()).toContain('Add task')
  })

  it('shows custom toggle label', () => {
    const wrapper = mount(QuickAddInput, { props: { toggleLabel: 'Add status' } })
    expect(wrapper.text()).toContain('Add status')
  })

  it('opens the input form when toggle button is clicked', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('disables the Add button when input is empty', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find((b) => b.text().includes('Add'))
    expect(addBtn).toBeTruthy()
    expect(addBtn!.attributes('disabled')).toBeDefined()
  })

  it('enables the Add button when text is entered', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    const input = wrapper.find('input')
    await input.setValue('New item')
    await input.trigger('input')
    await nextTick()
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find((b) => b.text().includes('Add'))
    expect(addBtn!.attributes('disabled')).toBeUndefined()
  })

  it('emits submit with trimmed name', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    const input = wrapper.find('input')
    await input.setValue('  spaced name  ')
    await input.trigger('input')
    await nextTick()
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find((b) => b.text().includes('Add'))
    await addBtn!.trigger('click')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0]).toEqual(['spaced name'])
  })

  it('does not emit submit when name is only whitespace', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    const input = wrapper.find('input')
    await input.setValue('   ')
    await input.trigger('input')
    await nextTick()
    const buttons = wrapper.findAll('button')
    const addBtn = buttons.find((b) => b.text().includes('Add'))
    await addBtn!.trigger('click')

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits submit on Enter key', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    const input = wrapper.find('input')
    await input.setValue('Via enter')
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0]).toEqual(['Via enter'])
  })

  it('closes the form on Escape key', async () => {
    const wrapper = mount(QuickAddInput)
    await wrapper.find('button').trigger('click')
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(true)

    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('shows spinner when isPending is true', async () => {
    const wrapper = mount(QuickAddInput, { props: { isPending: true } })
    await wrapper.find('button').trigger('click')
    await nextTick()
    await wrapper.find('input').setValue('pending task')
    await wrapper.find('input').trigger('input')
    await nextTick()

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })
})