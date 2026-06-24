import { debounce } from 'es-toolkit'
import { computed, onBeforeUnmount, ref, toValue, watch } from 'vue'
import type { MaybeRef } from 'vue'

export function useDebouncedValue<T>(
  source: MaybeRef<T>,
  delay: MaybeRef<number> = 300,
  shouldDebounce: (value: T) => boolean = () => true,
) {
  const current = computed(() => toValue(source))
  const debounced = ref<T>(current.value)
  const isDebouncing = ref(false)

  const commit = debounce((value: T) => {
    debounced.value = value
    isDebouncing.value = false
  }, toValue(delay))

  watch(
    current,
    (value) => {
      if (!shouldDebounce(value)) {
        commit.cancel()
        debounced.value = value
        isDebouncing.value = false
        return
      }

      isDebouncing.value = true
      commit(value)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    commit.cancel()
  })

  return {
    debounced,
    isDebouncing,
  }
}
