<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Loader2, XCircle, ArrowLeft, CalendarClock, Pencil, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProject } from '@/composables/useProject'
import { useUpdateProject } from '@/composables/useUpdateProject'
import { useDeleteProject } from '@/composables/useDeleteProject'
import { useUsersByID } from '@/composables/useUsersByID'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog.vue'
import ProjectDeleteDialog from '@/components/projects/ProjectDeleteDialog.vue'
import UserDisplay from '@/components/UserDisplay.vue'
import { ApiError } from '@/api/client'
import { formatDate, formatRelativeDate, isOverdue } from '@/lib/date'
import type { CreateProjectInput } from '@/api/projects'

const route = useRoute()
const router = useRouter()
const projectID = computed(() => route.params.projectID as string)
const { data: project, isLoading, isError, error } = useProject(projectID)
const ownerIDs = computed(() => (project.value ? [project.value.ownerId] : []))
const { data: usersByID } = useUsersByID(ownerIDs)

const updateMutation = useUpdateProject()
const deleteMutation = useDeleteProject()

const formOpen = ref(false)
const deleteOpen = ref(false)
const formBusy = updateMutation.isPending
const deleteBusy = deleteMutation.isPending

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
      void router.push('/projects')
    },
  })
}

const accessError = computed(() => {
  if (!isError.value || !error.value) return null
  const status = error.value instanceof ApiError ? error.value.problem.status : undefined
  if (status === 404) {
    return {
      title: 'Project not found',
      message: 'This project does not exist or you no longer have access to it.',
    }
  }
  if (status === 403) {
    return {
      title: 'Access denied',
      message: 'You do not have permission to view this project.',
    }
  }
  if (status === 401) {
    return {
      title: 'Session expired',
      message: 'Your session has expired. Sign in again to continue.',
    }
  }
  return {
    title: 'Could not load project',
    message:
      error.value instanceof Error
        ? error.value.message
        : 'Something went wrong while loading this project.',
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant="outline"
        size="sm"
        as-child
      >
        <RouterLink to="/">
          <ArrowLeft data-icon="inline-start" />
          Back to projects
        </RouterLink>
      </Button>

      <div
        v-if="project"
        class="flex items-center gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          @click="formOpen = true"
        >
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="hover:text-destructive"
          @click="deleteOpen = true"
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-12"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Loading project…</p>
    </div>

    <div
      v-else-if="accessError"
      class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div class="flex items-start gap-3">
        <XCircle class="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <h2 class="font-semibold text-destructive">{{ accessError.title }}</h2>
          <p class="mt-1 text-sm text-destructive/90">{{ accessError.message }}</p>
        </div>
      </div>
    </div>

    <div
      v-else-if="project"
      class="flex flex-col gap-4"
    >
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-semibold">{{ project.name }}</h1>
        <p
          v-if="project.description"
          class="whitespace-pre-wrap text-sm text-muted-foreground"
        >
          {{ project.description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div
          v-if="usersByID?.[project.ownerId]"
          class="flex items-center gap-2"
        >
          <span>Owner:</span>
          <UserDisplay :user="usersByID[project.ownerId]!" />
        </div>
        <div
          v-if="project.dueDate"
          class="flex items-center gap-1.5"
          :class="isOverdue(project.dueDate) ? 'text-destructive' : ''"
        >
          <CalendarClock class="size-4" data-icon="inline-start" />
          <span>Due {{ formatDate(project.dueDate) }}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Task workspace will be built in the next phase.
          </p>
        </CardContent>
      </Card>

      <p class="text-xs text-muted-foreground">
        Created {{ formatRelativeDate(project.createdAt) }} · Updated
        {{ formatRelativeDate(project.updatedAt) }}
      </p>
    </div>

    <ProjectFormDialog
      v-if="project"
      v-model:open="formOpen"
      mode="edit"
      :project="project"
      :is-pending="formBusy"
      @submit="handleFormSubmit"
    />

    <ProjectDeleteDialog
      v-if="project"
      v-model:open="deleteOpen"
      :project="project"
      :is-pending="deleteBusy"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
