<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Loader2, XCircle } from '@lucide/vue'
import TaskGroup from '@/components/tasks/TaskGroup.vue'
import { useProject } from '@/composables/useProject'
import { useStatuses } from '@/composables/useStatuses'
import { useTasks } from '@/composables/useTasks'
import { useMembers } from '@/composables/useMembers'
import { useMe } from '@/composables/useMe'
import { useUsersByID } from '@/composables/useUsersByID'
import { useEffectiveRole } from '@/composables/useEffectiveRole'
import { ApiError } from '@/api/client'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'

const props = defineProps<{
  projectID: string
}>()

const { data: project, isLoading, isError, error } = useProject(computed(() => props.projectID))
const { data: statuses } = useStatuses(computed(() => props.projectID))
const { data: tasks } = useTasks(computed(() => props.projectID))
const { data: members } = useMembers(computed(() => props.projectID))
const { data: me } = useMe()

const userIDs = computed(() => {
  const ids: string[] = []
  if (project.value) ids.push(project.value.ownerId)
  for (const m of members.value ?? []) ids.push(m.userId)
  for (const t of tasks.value ?? []) {
    if (t.assigneeId) ids.push(t.assigneeId)
    ids.push(t.ownerId)
  }
  return ids
})
const { data: usersByID } = useUsersByID(userIDs)

const { canModify } = useEffectiveRole(
  computed(() => me.value?.id),
  project,
  members,
)

const collapsedStatuses = reactive<Record<string, boolean>>({
  done: true,
  cancelled: true,
})

function toggleCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

const groupedTasks = computed(() => {
  const statusOrder: string[] = (statuses.value ?? []).map((s: ProjectStatus) => s.status)
  const defaultStatuses = ['todo', 'in_progress', 'done', 'cancelled']
  const allStatuses = [...new Set([...statusOrder, ...defaultStatuses])]

  const byStatus = new Map<string, Task[]>()
  for (const status of allStatuses) {
    byStatus.set(status, [])
  }

  for (const task of tasks.value ?? []) {
    const existing = byStatus.get(task.status) ?? []
    existing.push(task)
    byStatus.set(task.status, existing)
  }

  return allStatuses
    .filter((s) => statusOrder.includes(s) || (byStatus.get(s)?.length ?? 0) > 0)
    .map((status) => ({
      status,
      tasks: byStatus.get(status) ?? [],
    }))
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
    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-12"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Loading tasks…</p>
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
      v-else
      class="flex flex-col gap-6"
    >
      <div
        v-for="group in groupedTasks"
        :key="group.status"
      >
        <TaskGroup
          :status="group.status"
          :tasks="group.tasks"
          :users-by-i-d="usersByID ?? {}"
          :collapsed="collapsedStatuses[group.status]"
          @toggle-collapse="toggleCollapse"
        />
      </div>

      <div
        v-if="groupedTasks.length === 0 && project"
        class="py-12 text-center text-muted-foreground"
      >
        <p class="text-sm">No tasks yet.</p>
        <p
          v-if="canModify"
          class="mt-1 text-xs"
        >
          Create your first task to get started.
        </p>
      </div>
    </div>
  </div>
</template>