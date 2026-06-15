<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@lucide/vue'
import { useDeleteTask } from '@/composables/useDeleteTask'
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
  <AlertDialog
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete task?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete <strong>{{ task.name }}</strong> and all its subtasks.
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          <Loader2 v-if="deleteMutation.isPending.value" class="size-4 animate-spin" />
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>