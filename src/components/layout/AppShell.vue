<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { useMe } from '@/composables/useMe'
import { ApiError } from '@/api/client'
import { Loader2, AlertCircle, LogOut } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ThemeToggle from './ThemeToggle.vue'

const { isLoading, isError, error, data: me, refetch } = useMe()

const publicOrigin =
  (import.meta.env.VITE_TASKS_PUBLIC_ORIGIN as string | undefined) ?? window.location.origin

const signOutHref = computed(() => `/oauth2/sign_out?rd=${encodeURIComponent(publicOrigin)}`)

const accessError = computed(() => {
  if (!isError.value || !error.value) return null
  const status = error.value instanceof ApiError ? error.value.problem.status : undefined
  if (status === 401) {
    return {
      title: 'Session expired',
      message: 'Your session has expired. Sign in again to continue.',
    }
  }
  if (status === 403) {
    return {
      title: 'Access denied',
      message: 'You do not have permission to access this app.',
    }
  }
  return {
    title: 'Could not load session',
    message:
      error.value instanceof Error
        ? error.value.message
        : 'Something went wrong while loading your account.',
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <header
      class="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <RouterLink to="/" class="text-lg font-semibold tracking-tight hover:text-primary">
          Tasks
        </RouterLink>
      </div>

      <div class="flex items-center gap-2">
        <div
          v-if="me"
          class="hidden text-right leading-none sm:block"
        >
          <div class="text-sm font-medium">
            {{ me.name }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ me.email }}
          </div>
        </div>
        <ThemeToggle />
        <a
          v-if="signOutHref"
          :href="signOutHref"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut class="h-4 w-4" />
          Sign out
        </a>
      </div>
    </header>

    <main class="flex-1 p-4">
      <div v-if="isLoading" class="flex flex-col items-center gap-3 py-12">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="text-sm text-muted-foreground">Loading your account…</p>
      </div>

      <div
        v-else-if="accessError"
        class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        role="alert"
        aria-live="assertive"
      >
        <div class="flex items-start gap-3">
          <AlertCircle class="mt-0.5 h-5 w-5 text-destructive" />
          <div class="flex-1">
            <h2 class="font-semibold text-destructive">
              {{ accessError.title }}
            </h2>
            <p class="mt-1 text-sm text-destructive/90">
              {{ accessError.message }}
            </p>
            <div class="mt-4 flex gap-2">
              <Button type="button" @click="refetch()"> Retry </Button>
              <Button variant="outline" as-child>
                <a :href="signOutHref"> Sign in again </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RouterView v-else-if="me" />
    </main>
  </div>
</template>
