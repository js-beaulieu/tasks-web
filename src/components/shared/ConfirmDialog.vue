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

defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  isPending?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description">
          <slot name="description">{{ description }}</slot>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isPending">Cancel</AlertDialogCancel>
        <Button variant="destructive" :disabled="isPending" @click="emit('confirm')">
          <Loader2 v-if="isPending" class="size-4 animate-spin" />
          {{ confirmLabel ?? 'Confirm' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
