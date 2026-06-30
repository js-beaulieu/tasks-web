<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProject } from '@/composables/projects/useProject'
import { useMembers } from '@/composables/members/useMembers'
import { useUsersByID } from '@/composables/users/useUsersByID'
import { useAccessError } from '@/composables/useAccessError'
import { useStatuses } from '@/composables/statuses/useStatuses'
import { useProjectPermissions } from '@/composables/projects/useProjectPermissions'
import { provideProjectContext } from '@/composables/projects/useProjectContext'
import TaskWorkspace from '@/components/tasks/TaskWorkspace.vue'
import ProjectMembersTab from '@/components/projects/ProjectMembersTab.vue'
import ProjectSettingsTab from '@/components/projects/ProjectSettingsTab.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorAlert from '@/components/shared/ErrorAlert.vue'
import { formatRelativeDate } from '@/lib/date'

const route = useRoute()
const router = useRouter()
const projectID = computed(() => route.params.projectID as string)

const { data: project, isLoading, isError, error } = useProject(projectID)
const { data: members } = useMembers(projectID)
const { data: statuses } = useStatuses(projectID)
const { canModify } = useProjectPermissions(project)

const ownerIDs = computed(() => (project.value ? [project.value.ownerId] : []))
const memberIDs = computed(() => (members.value ?? []).map((m) => m.userId))
const allUserIDs = computed(() => [...new Set([...ownerIDs.value, ...memberIDs.value])])
const { data: usersByID } = useUsersByID(allUserIDs)

provideProjectContext({
  projectID,
  statuses: computed(() => statuses.value ?? []),
  usersByID: computed(() => usersByID.value),
  canModify,
})

const activeTab = computed({
  get: () => (route.query.tab as string) || 'tasks',
  set: (tab: string) => {
    router.replace({ query: { ...route.query, tab } })
  },
})

const accessError = useAccessError(isError, error, 'project')
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

    <LoadingState v-if="isLoading" message="Loading project…" />

    <ErrorAlert v-else-if="accessError" :title="accessError.title" :message="accessError.message" />

    <div v-else-if="project" class="flex flex-col gap-4">
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
