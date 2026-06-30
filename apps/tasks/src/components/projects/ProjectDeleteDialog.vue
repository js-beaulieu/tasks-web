<script setup lang="ts">
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import type { Project } from '@/api/projects'

defineProps<{
  open: boolean
  project: Project
  isPending?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="Delete project?"
    confirm-label="Delete"
    :is-pending="isPending"
    @update:open="emit('update:open', $event)"
    @confirm="emit('confirm')"
  >
    <template #description>
      This will permanently delete <strong>{{ project.name }}</strong
      >. This action cannot be undone.
    </template>
  </ConfirmDialog>
</template>
