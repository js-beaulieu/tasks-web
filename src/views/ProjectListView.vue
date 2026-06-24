<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, FolderOpen } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProjectCard from '@/components/projects/ProjectCard.vue'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog.vue'
import ProjectDeleteDialog from '@/components/projects/ProjectDeleteDialog.vue'
import { useProjects } from '@/composables/useProjects'
import { useCreateProject } from '@/composables/useCreateProject'
import { useUpdateProject } from '@/composables/useUpdateProject'
import { useDeleteProject } from '@/composables/useDeleteProject'
import { useUsersByID } from '@/composables/useUsersByID'
import { canModifyRole, canAdminRole } from '@/composables/useProjectPermissions'
import { useAccessError } from '@/composables/useAccessError'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorAlert from '@/components/shared/ErrorAlert.vue'
import type { CreateProjectInput, Project } from '@/api/projects'
import type { User } from '@/api/users'

type SortKey = 'newest' | 'oldest' | 'name'

const router = useRouter()
const { data: projects, isLoading, isError, error } = useProjects()
const createMutation = useCreateProject()
const updateMutation = useUpdateProject()
const deleteMutation = useDeleteProject()

const ownerIDs = computed(() => projects.value?.map((p) => p.ownerId) ?? [])
const { data: usersByID } = useUsersByID(ownerIDs)

const sort = ref<SortKey>('newest')

function getOwner(ownerId: string): User {
  return (
    usersByID?.value?.[ownerId] ?? {
      id: ownerId,
      name: 'Unknown',
      email: '',
      createdAt: '',
    }
  )
}

const projectsWithOwners = computed(() => {
  return (projects.value ?? []).map((project) => ({
    project,
    owner: getOwner(project.ownerId),
  }))
})

const sortedProjects = computed(() => {
  const list = [...projectsWithOwners.value]
  switch (sort.value) {
    case 'oldest':
      return list.sort(
        (a, b) =>
          new Date(a.project.createdAt).getTime() -
          new Date(b.project.createdAt).getTime(),
      )
    case 'name':
      return list.sort((a, b) => a.project.name.localeCompare(b.project.name))
    case 'newest':
    default:
      return list.sort(
        (a, b) =>
          new Date(b.project.createdAt).getTime() -
          new Date(a.project.createdAt).getTime(),
      )
  }
})

function makeEmptyProject(): Project {
  return {
    id: '',
    name: '',
    ownerId: '',
    createdAt: '',
    updatedAt: '',
  }
}

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formProject = ref<Project>(makeEmptyProject())
const deleteOpen = ref(false)
const deleteProjectRef = ref<Project | undefined>(undefined)
const formBusy = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)
const deleteBusy = deleteMutation.isPending

function openCreate() {
  formMode.value = 'create'
  formProject.value = makeEmptyProject()
  formOpen.value = true
}

function openEdit(project: Project) {
  formMode.value = 'edit'
  formProject.value = project
  formOpen.value = true
}

function openDelete(project: Project) {
  deleteProjectRef.value = project
  deleteOpen.value = true
}

async function handleFormSubmit(input: CreateProjectInput) {
  if (formMode.value === 'edit') {
    await updateMutation.mutateAsync(
      { projectID: formProject.value.id, input },
      {
        onSuccess: () => {
          formOpen.value = false
        },
      },
    )
  } else {
    const created = await createMutation.mutateAsync(input)
    formOpen.value = false
    void router.push(`/projects/${created.id}`)
  }
}

async function handleDeleteConfirm() {
  const target = deleteProjectRef.value
  if (!target) return
  await deleteMutation.mutateAsync(target.id, {
    onSuccess: () => {
      deleteOpen.value = false
      deleteProjectRef.value = undefined
    },
  })
}

const accessError = useAccessError(isError, error, 'projects')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-lg font-semibold">Projects</h1>
      <div class="flex items-center gap-2">
        <Select v-model="sort">
          <SelectTrigger class="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Button @click="openCreate">
          <Plus data-icon="inline-start" />
          New project
        </Button>
      </div>
    </div>

    <LoadingState v-if="isLoading" message="Loading projects…" />

    <ErrorAlert
      v-else-if="accessError"
      :title="accessError.title"
      :message="accessError.message"
    />

    <div
      v-else-if="sortedProjects.length === 0"
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center"
    >
      <FolderOpen class="h-10 w-10 text-muted-foreground" />
      <div>
        <h2 class="font-medium">No projects yet</h2>
        <p class="text-sm text-muted-foreground">Create your first project to get started.</p>
      </div>
      <Button @click="openCreate">
        <Plus data-icon="inline-start" />
        New project
      </Button>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <ProjectCard
        v-for="item in sortedProjects"
        :key="item.project.id"
        :project="item.project"
        :owner="item.owner"
        :can-modify="canModifyRole(item.project.effectiveRole)"
        :can-admin="canAdminRole(item.project.effectiveRole)"
        @edit="openEdit"
        @delete="openDelete"
      />
    </div>

    <ProjectFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :project="formProject"
      :is-pending="formBusy"
      @submit="handleFormSubmit"
    />

    <ProjectDeleteDialog
      v-if="deleteProjectRef"
      v-model:open="deleteOpen"
      :project="deleteProjectRef"
      :is-pending="deleteBusy"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>
