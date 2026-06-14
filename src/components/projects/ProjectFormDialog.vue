<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CreateProjectInput, Project } from '@/api/projects'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  project: Project
  isPending?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [input: CreateProjectInput]
}>()

const name = ref('')
const description = ref('')

const isEdit = computed(() => props.mode === 'edit')
const title = computed(() => (isEdit.value ? 'Edit project' : 'New project'))

function focusName() {
  const input = document.getElementById('project-name')
  if (input instanceof HTMLInputElement) {
    input.focus()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = props.project.name
      description.value = props.project.description ?? ''
      void nextTick(focusName)
    }
  },
)

function handleSubmit() {
  const trimmedName = name.value.trim()
  if (!trimmedName) return

  emit('submit', {
    name: trimmedName,
    description: description.value.trim() || undefined,
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Update the project name and description.' : 'Create a new project to organize your tasks.' }}
        </DialogDescription>
      </DialogHeader>

      <form
        id="project-form"
        class="flex flex-col gap-4"
        @submit.prevent="handleSubmit"
      >
        <div class="flex flex-col gap-2">
          <Label for="project-name">Name</Label>
          <Input
            id="project-name"
            v-model="name"
            placeholder="Project name"
            required
          />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="project-description">Description</Label>
          <Textarea
            id="project-description"
            v-model="description"
            placeholder="Optional description"
            rows="3"
          />
        </div>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="project-form"
          :disabled="isPending"
        >
          <Loader2 v-if="isPending" class="size-4 animate-spin" />
          {{ isEdit ? 'Save' : 'Create' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
