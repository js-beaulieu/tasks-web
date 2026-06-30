import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

export type TaskSortMode = 'position' | 'dueDate'
export type TaskViewMode = 'vertical' | 'board'
export type ColorMode = 'light' | 'dark'

function defaultViewMode(): TaskViewMode {
  if (typeof window === 'undefined') return 'board'
  return window.matchMedia('(min-width: 768px)').matches ? 'board' : 'vertical'
}

function initialColorMode(): ColorMode {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export const useUIStore = defineStore(
  'ui',
  () => {
    const sortMode = ref<TaskSortMode>('position')
    const viewMode = ref<TaskViewMode>(defaultViewMode())
    const theme = ref<ColorMode>(initialColorMode())

    const isManualOrder = computed(() => sortMode.value === 'position')
    const isDark = computed(() => theme.value === 'dark')

    function setSortMode(mode: TaskSortMode) {
      sortMode.value = mode
    }

    function setViewMode(mode: TaskViewMode) {
      viewMode.value = mode
    }

    function setTheme(mode: ColorMode) {
      theme.value = mode
    }

    function toggleTheme() {
      theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    return {
      sortMode,
      viewMode,
      theme,
      isManualOrder,
      isDark,
      setSortMode,
      setViewMode,
      setTheme,
      toggleTheme,
    }
  },
  {
    persist: {
      key: 'hs-web-tasks-ui',
      pick: ['sortMode', 'viewMode', 'theme'],
    },
  } as { persist: PersistenceOptions },
)
