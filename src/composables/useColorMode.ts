import { computed, onMounted, ref, watch } from 'vue'

type ColorMode = 'light' | 'dark'

const MODE_KEY = 'tasks-web-color-scheme'

function getInitialMode(): ColorMode {
  // The inline script in index.html already resolves the user's saved
  // preference (or system preference) and sets the `.dark` class before
  // the app paints. The composable only needs to read that resolved state,
  // avoiding duplication of the storage/media-query logic.
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function apply(mode: ColorMode): void {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = mode
}

export function useColorMode() {
  const mode = ref<ColorMode>(getInitialMode())

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  watch(mode, (newMode) => {
    apply(newMode)
    localStorage.setItem(MODE_KEY, newMode)
  })

  onMounted(() => {
    apply(mode.value)
  })

  return {
    mode,
    toggle,
    isDark: computed(() => mode.value === 'dark'),
  }
}
