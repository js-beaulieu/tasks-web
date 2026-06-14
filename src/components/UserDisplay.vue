<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/api/users'

const props = defineProps<{
  user: User
}>()

const initials = computed(() => {
  if (!props.user.name) {
    return '?'
  }

  return props.user.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <div class="flex min-w-0 items-start gap-2">
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      :title="user.email"
    >
      {{ initials }}
    </div>
    <div class="flex min-w-0 flex-col">
      <span class="truncate text-sm font-medium leading-tight">{{ user.name }}</span>
      <span v-if="user.email" class="truncate text-xs leading-tight text-muted-foreground">{{
        user.email
      }}</span>
    </div>
  </div>
</template>
