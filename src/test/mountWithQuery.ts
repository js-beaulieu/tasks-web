import { mount, type DOMWrapper } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { defineComponent } from 'vue'

export function mountWithQuery(component: ReturnType<typeof defineComponent>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 5 * 60 * 1000 } },
  })
  return mount(component, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  })
}

export type { DOMWrapper }
