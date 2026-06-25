<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'

defineProps<{ title: string; message: string }>()
</script>

<template>
  <div
    class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4"
    role="alert"
    aria-live="assertive"
  >
    <div class="flex items-start gap-3">
      <AlertCircle class="mt-0.5 h-5 w-5 text-destructive" />
      <div class="flex-1">
        <h2 class="font-semibold text-destructive">{{ title }}</h2>
        <p class="mt-1 text-sm text-destructive/90">{{ message }}</p>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
