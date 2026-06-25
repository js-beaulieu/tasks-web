<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'
import { useMe } from '@/composables/users/useMe'
import { useAccessError } from '@/composables/useAccessError'
import { LogOut } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorAlert from '@/components/shared/ErrorAlert.vue'
import ThemeToggle from './ThemeToggle.vue'

const { isLoading, isError, error, data: me, refetch } = useMe()

const publicOrigin =
  (import.meta.env.VITE_TASKS_PUBLIC_ORIGIN as string | undefined) ?? window.location.origin

const signOutHref = computed(() => `/oauth2/sign_out?rd=${encodeURIComponent(publicOrigin)}`)

const accessError = useAccessError(isError, error, 'account')
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
        <div v-if="me" class="hidden text-right leading-none sm:block">
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
      <LoadingState v-if="isLoading" message="Loading your account…" />

      <ErrorAlert v-else-if="accessError" :title="accessError.title" :message="accessError.message">
        <template #actions>
          <div class="mt-4 flex gap-2">
            <Button type="button" @click="refetch()"> Retry </Button>
            <Button variant="outline" as-child>
              <a :href="signOutHref"> Sign in again </a>
            </Button>
          </div>
        </template>
      </ErrorAlert>

      <RouterView v-else-if="me" />
    </main>
  </div>
</template>
