<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProject } from '@/composables/useProject'
import { useMembers } from '@/composables/useMembers'
import { useUsersByID } from '@/composables/useUsersByID'
import TaskWorkspace from '@/components/tasks/TaskWorkspace.vue'
import ProjectMembersTab from '@/components/projects/ProjectMembersTab.vue'
import ProjectSettingsTab from '@/components/projects/ProjectSettingsTab.vue'
import { ApiError } from '@/api/client'
import { formatRelativeDate } from '@/lib/date'

const route = useRoute()
const router = useRouter()
const projectID = computed(() => route.params.projectID as string)

const { data: project, isLoading, isError, error } = useProject(projectID)
const { data: members } = useMembers(projectID)

const ownerIDs = computed(() => (project.value ? [project.value.ownerId] : []))
const memberIDs = computed(() => (members.value ?? []).map((m) => m.userId))
const allUserIDs = computed(() => [...new Set([...ownerIDs.value, ...memberIDs.value])])
const { data: usersByID } = useUsersByID(allUserIDs)

const activeTab = computed({
  get: () => (route.query.tab as string) || 'tasks',
  set: (tab: string) => {
    router.replace({ query: { ...route.query, tab } })
  },
})

const accessError = computed(() => {
  if (!isError.value || !error.value) return null
  const status = error.value instanceof ApiError ? error.value.problem.status : undefined
  if (status === 404) {
    return { title: 'Project not found', message: 'This project does not exist or you no longer have access to it.' }
  }
  if (status === 403) {
    return { title: 'Access denied', message: 'You do not have permission to view this project.' }
  }
  if (status === 401) {
    return { title: 'Session expired', message: 'Your session has expired. Sign in again to continue.' }
  }
  return {
    title: 'Could not load project',
    message: error.value instanceof Error ? error.value.message : 'Something went wrong while loading this project.',
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button variant="outline" size="sm" as-child>
        <RouterLink to="/projects">
          <ArrowLeft data-icon="inline-start" />
          Back to projects
        </RouterLink>
      </Button>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-12"
    >
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p class="text-sm text-muted-foreground">Loading project…</p>
    </div>

    <div
      v-else-if="accessError"
      class="mx-auto max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div class="flex items-start gap-3">
        <div class="mt-0.5 h-5 w-5 text-destructive">✕</div>
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
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span v-if="usersByID?.[project.ownerId]">
            Owner: {{ usersByID[project.ownerId]!.name }}
          </span>
          <span>{{ formatRelativeDate(project.createdAt) }}</span>
        </div>
        <p
          v-if="project.description"
          class="mt-1 whitespace-pre-wrap text-sm text-muted-foreground"
        >
          {{ project.description }}
        </p>
      </div>

      <Tabs v-model="activeTab" class="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" class="mt-4">
          <TaskWorkspace :project-i-d="projectID" />
        </TabsContent>

        <TabsContent value="members" class="mt-4">
          <ProjectMembersTab :project-i-d="projectID" />
        </TabsContent>

        <TabsContent value="settings" class="mt-4">
          <ProjectSettingsTab :project-i-d="projectID" />
        </TabsContent>
      </Tabs>
      <RouterView />
    </div>
  </div>
</template>