<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { groupBy, uniq } from 'es-toolkit'
import { Loader2, XCircle, LayoutGrid, List } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import TaskGroup from '@/components/tasks/TaskGroup.vue'
import BoardView from '@/components/tasks/BoardView.vue'
import TaskDeleteDialog from '@/components/tasks/TaskDeleteDialog.vue'
import { useProject } from '@/composables/useProject'
import { useStatuses } from '@/composables/useStatuses'
import { useTasks } from '@/composables/useTasks'
import { useMembers } from '@/composables/useMembers'
import { useMe } from '@/composables/useMe'
import { useUsersByID } from '@/composables/useUsersByID'
import { useEffectiveRole } from '@/composables/useEffectiveRole'
import { useCreateTask } from '@/composables/useCreateTask'
import { useCompleteTask } from '@/composables/useCompleteTask'
import { useUpdateTask } from '@/composables/useUpdateTask'
import { useTaskViewPreference } from '@/composables/useTaskViewPreference'
import { ApiError } from '@/api/client'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'

const props = defineProps<{
  projectID: string
}>()

const router = useRouter()

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
  return uniq(ids)
})
const { data: usersByID } = useUsersByID(userIDs)

const { canModify } = useEffectiveRole(
  computed(() => me.value?.id),
  project,
  members,
)

const { view } = useTaskViewPreference()

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
  const allStatuses = uniq([...statusOrder, ...defaultStatuses])

  const grouped = groupBy(tasks.value ?? [], (t) => t.status)

  return allStatuses
    .filter((s) => statusOrder.includes(s) || (grouped[s]?.length ?? 0) > 0)
    .map((status) => ({
      status,
      tasks: grouped[status] ?? [],
    }))
})

const doneStatus = computed(() => {
  const statusList = statuses.value ?? []
  const done = statusList.find((s) => s.status === 'done')
  return done ? done.status : 'done'
})

const firstStatus = computed(() => {
  const statusList = statuses.value ?? []
  if (statusList.length > 0) return statusList[0]!.status
  return 'todo'
})

const createMutation = useCreateTask()
const completeMutation = useCompleteTask()
const updateMutation = useUpdateTask()

function handleQuickAdd(status: string, name: string) {
  createMutation.mutate({
    projectID: props.projectID,
    input: {
      name,
      status,
      assigneeId: me.value?.id,
    },
  })
}

function openTask(taskID: string) {
  router.push({
    name: 'task-detail',
    params: { projectID: props.projectID, taskID },
  })
}

function handleCompleteTask(taskID: string) {
  completeMutation.mutate({
    taskID,
    doneStatus: doneStatus.value,
    projectID: props.projectID,
  })
}

function handleUncompleteTask(taskID: string) {
  updateMutation.mutate({
    taskID,
    input: { status: firstStatus.value },
  })
}

function handleMoveStatus(taskID: string, status: string) {
  if (status === doneStatus.value) {
    handleCompleteTask(taskID)
  } else {
    updateMutation.mutate({ taskID, input: { status } })
  }
}

const deleteTaskID = ref<string | null>(null)
const deleteTaskObj = computed<Task | null>(() => {
  if (!deleteTaskID.value) return null
  return (tasks.value ?? []).find((t) => t.id === deleteTaskID.value) ?? null
})

function handleDeleteTask(taskID: string) {
  deleteTaskID.value = taskID
}

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
      class="flex flex-col gap-4"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          {{ (tasks ?? []).length }} task{{ (tasks ?? []).length !== 1 ? 's' : '' }}
        </div>
        <div class="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            :class="view === 'vertical' ? 'bg-accent' : ''"
            @click="view = 'vertical'"
          >
            <List class="mr-1 h-3.5 w-3.5" />
            List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            :class="view === 'board' ? 'bg-accent' : ''"
            @click="view = 'board'"
          >
            <LayoutGrid class="mr-1 h-3.5 w-3.5" />
            Board
          </Button>
        </div>
      </div>

      <div v-if="view === 'board'">
        <BoardView
          :project-i-d="projectID"
          :statuses="statuses ?? []"
          :grouped-tasks="groupedTasks"
          :users-by-i-d="usersByID ?? {}"
          :can-modify="canModify"
          @open-task="openTask"
          @complete="handleCompleteTask"
          @uncomplete="handleUncompleteTask"
          @delete="handleDeleteTask"
          @move-status="handleMoveStatus"
          @quick-add="handleQuickAdd"
        />
      </div>

      <div v-else class="flex flex-col gap-6">
        <div
          v-for="group in groupedTasks"
          :key="group.status"
        >
          <TaskGroup
            :status="group.status"
            :tasks="group.tasks"
            :users-by-i-d="usersByID ?? {}"
            :project-i-d="projectID"
            :statuses="statuses ?? []"
            :can-modify="canModify"
            :collapsed="collapsedStatuses[group.status]"
            :show-checkbox="true"
            :show-quick-add="true"
            @toggle-collapse="toggleCollapse"
            @open-task="openTask"
            @complete="handleCompleteTask"
            @uncomplete="handleUncompleteTask"
            @delete="handleDeleteTask"
            @move-status="handleMoveStatus"
            @quick-add="handleQuickAdd"
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

      <TaskDeleteDialog
        v-if="deleteTaskObj"
        :open="!!deleteTaskID"
        :task="deleteTaskObj"
        :project-i-d="projectID"
        @update:open="deleteTaskID = $event ? deleteTaskID : null"
        @deleted="deleteTaskID = null"
      />
    </div>
  </div>
</template>