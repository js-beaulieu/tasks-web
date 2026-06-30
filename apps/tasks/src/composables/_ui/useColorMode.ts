import { computed, onMounted, watch } from 'vue'
import { useUIStore } from '@/stores/ui'

export type ColorMode = 'light' | 'dark'

function apply(mode: 'light' | 'dark'): void {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = mode
}

export function useColorMode() {
  const store = useUIStore()

  const mode = computed({
    get: () => store.theme,
    set: (v: 'light' | 'dark') => store.setTheme(v),
  })

  function toggle() {
    store.toggleTheme()
  }

  watch(
    () => store.theme,
    (newMode) => {
      apply(newMode)
    },
  )

  onMounted(() => {
    apply(store.theme)
  })

  return {
    mode,
    toggle,
    isDark: computed(() => store.isDark),
  }
}
