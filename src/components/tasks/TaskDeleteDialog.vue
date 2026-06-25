<script setup lang="ts">
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { useDeleteTask } from '@/composables/tasks/useDeleteTask'
import type { Task } from '@/api/tasks'

const props = defineProps<{
  open: boolean
  task: Task
  projectID: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  deleted: []
}>()

const deleteMutation = useDeleteTask()

function confirmDelete() {
  deleteMutation.mutate(
    { taskID: props.task.id, projectID: props.projectID },
    {
      onSuccess: () => {
        emit('update:open', false)
        emit('deleted')
      },
    },
  )
}
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="Delete task?"
    confirm-label="Delete"
    :is-pending="deleteMutation.isPending.value"
    @update:open="emit('update:open', $event)"
    @confirm="confirmDelete"
  >
    <template #description>
      This will permanently delete <strong>{{ task.name }}</strong> and all its subtasks. This
      action cannot be undone.
    </template>
  </ConfirmDialog>
</template>
