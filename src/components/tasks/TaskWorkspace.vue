<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { groupBy, uniq, orderBy } from 'es-toolkit'
import { Loader2, XCircle, LayoutGrid, List, ArrowUpDown, Filter } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import TaskGroup from '@/components/tasks/TaskGroup.vue'
import BoardView from '@/components/tasks/BoardView.vue'
import TaskDeleteDialog from '@/components/tasks/TaskDeleteDialog.vue'
import { useProject } from '@/composables/useProject'
import { useStatuses } from '@/composables/useStatuses'
import { useTasks } from '@/composables/useTasks'
import { useMembers } from '@/composables/members/useMembers'
import { useMe } from '@/composables/useMe'
import { useUsersByID } from '@/composables/useUsersByID'
import { useProjectPermissions } from '@/composables/useProjectPermissions'
import { useCreateTask } from '@/composables/useCreateTask'
import { useCompleteTask } from '@/composables/useCompleteTask'
import { useUpdateTask } from '@/composables/useUpdateTask'
import { useTaskViewPreference } from '@/composables/useTaskViewPreference'
import { useTaskSort } from '@/composables/useTaskSort'
import { useTaskCardMetadata } from '@/composables/useTaskCardMetadata'
import { ApiError } from '@/api/client'
import { isOverdue } from '@/lib/date'
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

const { tagsByTask, subtaskCounts } = useTaskCardMetadata(
  computed(() => (tasks.value ?? []).map((t) => t.id)),
)

const { canModify } = useProjectPermissions(project)

const { view } = useTaskViewPreference()
const { sortMode, isManualOrder } = useTaskSort()
const dragResetKey = ref(0)

const collapsedStatuses = reactive<Record<string, boolean>>({
  done: true,
  cancelled: true,
})

function toggleCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

const sortedTasks = computed(() => {
  const allTasks = tasks.value ?? []
  if (isManualOrder.value) return allTasks

  const terminalStatuses = new Set(['done', 'cancelled'])

  return orderBy(
    allTasks,
    [
      (t: Task) => {
        if (sortMode.value === 'dueDate') {
          if (t.dueDate && isOverdue(t.dueDate)) return 0
          if (t.dueDate) return 1
          return 2
        }
        return 0
      },
      (t: Task) => {
        if (sortMode.value === 'dueDate') {
          if (terminalStatuses.has(t.status)) return t.updatedAt
          return t.dueDate ?? ''
        }
        return 0
      },
    ],
    ['asc', 'asc'],
  )
})

const selectedTags = ref<string[]>([])

const availableTags = computed(() => {
  const tagSet = new Set<string>()
  for (const tags of Object.values(tagsByTask.value)) {
    for (const tag of tags) tagSet.add(tag)
  }
  return [...tagSet].sort()
})

const hasActiveFilters = computed(() => selectedTags.value.length > 0)

const filteredTasks = computed(() => {
  const all = sortedTasks.value
  if (selectedTags.value.length === 0) return all
  return all.filter((t) => {
    const tags = tagsByTask.value[t.id] ?? []
    return selectedTags.value.every((st) => tags.includes(st))
  })
})

const groupedTasks = computed(() => {
  const statusOrder: string[] = (statuses.value ?? []).map((s: ProjectStatus) => s.status)
  const defaultStatuses = ['todo', 'in_progress', 'done', 'cancelled']
  const allStatuses = uniq([...statusOrder, ...defaultStatuses])

  const grouped = groupBy(filteredTasks.value, (t) => t.status)

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
const isAdding = computed(() => createMutation.isPending.value)
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
  completeMutation.mutate(
    {
      taskID,
      doneStatus: doneStatus.value,
      projectID: props.projectID,
    },
    {
      onError: () => {
        dragResetKey.value++
      },
    },
  )
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
    updateMutation.mutate(
      { taskID, input: { status } },
      {
        onError: () => {
          dragResetKey.value++
        },
      },
    )
  }
}

function handleReorder(taskID: string, newIndex: number, newStatus?: string) {
  if (newStatus && newStatus === doneStatus.value) {
    handleCompleteTask(taskID)
    return
  }
  const input: { position: number; status?: string } = { position: newIndex }
  if (newStatus) input.status = newStatus
  updateMutation.mutate(
    { taskID, input },
    {
      onError: () => {
        dragResetKey.value++
      },
    },
  )
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

const sortLabel = computed(() => {
  if (sortMode.value === 'dueDate') return 'Due date'
  return 'Manual'
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
          {{ filteredTasks.length }} task{{ filteredTasks.length !== 1 ? 's' : '' }}
          <span v-if="hasActiveFilters" class="text-xs"> (filtered)</span>
        </div>
        <div class="flex items-center gap-1">
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                class="h-7 px-2 text-xs gap-1"
                :class="hasActiveFilters ? 'border-primary' : ''"
              >
                <Filter class="h-3.5 w-3.5" />
                Filter
                <Badge
                  v-if="hasActiveFilters"
                  variant="secondary"
                  class="ml-0.5 text-[10px] leading-none"
                >
                  {{ selectedTags.length }}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" class="w-56">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">Filter by tags</span>
                  <Button
                    v-if="hasActiveFilters"
                    variant="ghost"
                    size="sm"
                    class="h-6 text-xs"
                    @click="selectedTags = []"
                  >
                    Clear
                  </Button>
                </div>
                <div
                  v-if="availableTags.length === 0"
                  class="py-2 text-center text-xs text-muted-foreground"
                >
                  No tags available
                </div>
                <div v-else class="flex flex-col gap-1">
                  <label
                    v-for="tag in availableTags"
                    :key="tag"
                    class="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      :model-value="selectedTags.includes(tag)"
                      @update:model-value="(v: boolean | 'indeterminate') => {
                        if (v === true) selectedTags = [...selectedTags, tag]
                        else selectedTags = selectedTags.filter((t) => t !== tag)
                      }"
                    />
                    {{ tag }}
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-7 px-2 text-xs gap-1">
                <ArrowUpDown class="h-3.5 w-3.5" />
                {{ sortLabel }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                :class="sortMode === 'position' ? 'bg-accent' : ''"
                @click="sortMode = 'position'"
              >
                Manual order
              </DropdownMenuItem>
              <DropdownMenuItem
                :class="sortMode === 'dueDate' ? 'bg-accent' : ''"
                @click="sortMode = 'dueDate'"
              >
                Due date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            type="single"
            :model-value="view"
            variant="outline"
            size="sm"
            @update:model-value="(v) => { if (v) view = v as 'board' | 'vertical' }"
          >
            <ToggleGroupItem value="vertical" class="text-xs">
              <List class="mr-1 h-3.5 w-3.5" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="board" class="text-xs">
              <LayoutGrid class="mr-1 h-3.5 w-3.5" />
              Board
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div v-if="view === 'board'">
        <BoardView
          :project-i-d="projectID"
          :statuses="statuses ?? []"
          :grouped-tasks="groupedTasks"
          :users-by-i-d="usersByID ?? {}"
          :can-modify="canModify"
          :drag-enabled="canModify && isManualOrder"
          :drag-reset-key="dragResetKey"
          :is-adding="isAdding"
          :tags-by-task="tagsByTask"
          :subtask-counts="subtaskCounts"
          @open-task="openTask"
          @delete="handleDeleteTask"
          @move-status="handleMoveStatus"
          @quick-add="handleQuickAdd"
          @reorder="handleReorder"
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
            :drag-enabled="canModify && isManualOrder"
            :drag-reset-key="dragResetKey"
            :is-adding="isAdding"
            :show-quick-add="true"
            :tags-by-task="tagsByTask"
            :subtask-counts="subtaskCounts"
            @toggle-collapse="toggleCollapse"
            @open-task="openTask"
            @complete="handleCompleteTask"
            @uncomplete="handleUncompleteTask"
            @delete="handleDeleteTask"
            @move-status="handleMoveStatus"
            @quick-add="handleQuickAdd"
            @reorder="handleReorder"
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
