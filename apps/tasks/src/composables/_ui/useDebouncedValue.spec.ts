import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('delays updates while debouncing is active', async () => {
    const source = ref('a')
    let state: ReturnType<typeof useDebouncedValue<string>>

    const TestComponent = defineComponent({
      setup() {
        state = useDebouncedValue(source, 300, (value) => value.length >= 2)
        return { state }
      },
      render() {
        return h('div')
      },
    })

    mount(TestComponent)

    expect(state!.debounced.value).toBe('a')
    expect(state!.isDebouncing.value).toBe(false)

    source.value = 'ab'
    await vi.advanceTimersByTimeAsync(299)
    expect(state!.debounced.value).toBe('a')
    expect(state!.isDebouncing.value).toBe(true)

    await vi.advanceTimersByTimeAsync(1)
    expect(state!.debounced.value).toBe('ab')
    expect(state!.isDebouncing.value).toBe(false)
  })

  it('updates immediately when shouldDebounce returns false', async () => {
    const source = ref('ab')
    let state: ReturnType<typeof useDebouncedValue<string>>

    const TestComponent = defineComponent({
      setup() {
        state = useDebouncedValue(source, 300, (value) => value.length >= 2)
        return { state }
      },
      render() {
        return h('div')
      },
    })

    mount(TestComponent)

    source.value = 'a'
    await vi.runAllTimersAsync()

    expect(state!.debounced.value).toBe('a')
    expect(state!.isDebouncing.value).toBe(false)
  })
})
