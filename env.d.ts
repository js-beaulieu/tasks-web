/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TASKS_API_BASE_URL?: string
  readonly VITE_TASKS_PUBLIC_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
