<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pencil, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog.vue'
import ProjectDeleteDialog from '@/components/projects/ProjectDeleteDialog.vue'
import StatusManagementSection from '@/components/projects/StatusManagementSection.vue'
import { useUpdateProject } from '@/composables/projects/useUpdateProject'
import { useDeleteProject } from '@/composables/projects/useDeleteProject'
import { useProject } from '@/composables/projects/useProject'
import { useProjectPermissions } from '@/composables/projects/useProjectPermissions'
import { formatDate, formatRelativeDate } from '@/lib/date'
import type { CreateProjectInput } from '@/api/projects'

const props = defineProps<{
  projectID: string
}>()

const { data: project } = useProject(computed(() => props.projectID))

const { canModify, canAdmin: isProjectAdmin } = useProjectPermissions(project)

const updateMutation = useUpdateProject()
const deleteMutation = useDeleteProject()

const formOpen = ref(false)
const deleteOpen = ref(false)

async function handleFormSubmit(input: CreateProjectInput) {
  if (!project.value) return
  await updateMutation.mutateAsync(
    { projectID: project.value.id, input },
    {
      onSuccess: () => {
        formOpen.value = false
      },
    },
  )
}

function handleDeleteConfirm() {
  if (!project.value) return
  deleteMutation.mutate(project.value.id, {
    onSuccess: () => {
      deleteOpen.value = false
    },
  })
}
</script>

<template>
  <div v-if="project" class="flex flex-col gap-6">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium text-muted-foreground">Name</span>
        <span class="text-sm">{{ project.name }}</span>
      </div>
      <div v-if="project.description" class="flex flex-col gap-1">
        <span class="text-xs font-medium text-muted-foreground">Description</span>
        <span class="whitespace-pre-wrap text-sm">{{ project.description }}</span>
      </div>
      <div v-if="project.dueDate" class="flex flex-col gap-1">
        <span class="text-xs font-medium text-muted-foreground">Due date</span>
        <span class="text-sm">{{ formatDate(project.dueDate) }}</span>
      </div>

      <Separator />

      <div class="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>Created {{ formatRelativeDate(project.createdAt) }}</span>
        <span>Updated {{ formatRelativeDate(project.updatedAt) }}</span>
      </div>
    </div>

    <Separator />

    <div class="flex items-center gap-2">
      <Button v-if="canModify" variant="outline" size="sm" @click="formOpen = true">
        <Pencil data-icon="inline-start" />
        Edit project
      </Button>
      <Button
        v-if="isProjectAdmin"
        variant="outline"
        size="sm"
        class="hover:text-destructive"
        @click="deleteOpen = true"
      >
        <Trash2 data-icon="inline-start" />
        Delete project
      </Button>
    </div>

    <Separator />

    <StatusManagementSection :project-i-d="projectID" :can-admin="isProjectAdmin" />

    <ProjectFormDialog
      v-model:open="formOpen"
      mode="edit"
      :project="project"
      :is-pending="updateMutation.isPending.value"
      @submit="handleFormSubmit"
    />

    <ProjectDeleteDialog
      v-model:open="deleteOpen"
      :project="project"
      :is-pending="deleteMutation.isPending.value"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
