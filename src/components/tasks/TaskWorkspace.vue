<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { uniq } from 'es-toolkit'
import TaskGroup from '@/components/tasks/TaskGroup.vue'
import BoardView from '@/components/tasks/BoardView.vue'
import TaskDeleteDialog from '@/components/tasks/TaskDeleteDialog.vue'
import TaskListToolbar from '@/components/tasks/TaskListToolbar.vue'
import { useProject } from '@/composables/projects/useProject'
import { useStatuses } from '@/composables/statuses/useStatuses'
import { useTasks } from '@/composables/tasks/useTasks'
import { useMembers } from '@/composables/members/useMembers'
import { useMe } from '@/composables/users/useMe'
import { useUsersByID } from '@/composables/users/useUsersByID'
import { useProjectPermissions } from '@/composables/projects/useProjectPermissions'
import { useTaskViewPreference } from '@/composables/_ui/useTaskViewPreference'
import { useTaskSort } from '@/composables/_ui/useTaskSort'
import { useTaskCardMetadata } from '@/composables/tasks/useTaskCardMetadata'
import { useAccessError } from '@/composables/useAccessError'
import { useTaskFilters } from '@/composables/tasks/useTaskFilters'
import { useTaskGroups } from '@/composables/tasks/useTaskGroups'
import { useTaskActions } from '@/composables/tasks/useTaskActions'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorAlert from '@/components/shared/ErrorAlert.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

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

const { selectedTags, availableTags, hasActiveFilters, filteredTasks } = useTaskFilters(
  tasks,
  tagsByTask,
  sortMode,
  isManualOrder,
)

const { groupedTasks, doneStatus, firstStatus } = useTaskGroups(filteredTasks, statuses)

const {
  isAdding,
  dragResetKey,
  deleteTaskID,
  deleteTaskObj,
  handleQuickAdd,
  handleCompleteTask,
  handleUncompleteTask,
  handleMoveStatus,
  handleReorder,
  handleDeleteTask,
} = useTaskActions(computed(() => props.projectID), tasks, me, doneStatus, firstStatus)

const collapsedStatuses = reactive<Record<string, boolean>>({
  done: true,
  cancelled: true,
})

function toggleCollapse(status: string) {
  collapsedStatuses[status] = !collapsedStatuses[status]
}

function openTask(taskID: string) {
  router.push({
    name: 'task-detail',
    params: { projectID: props.projectID, taskID },
  })
}

const accessError = useAccessError(isError, error, 'project')

const sortLabel = computed(() => sortMode.value === 'dueDate' ? 'Due date' : 'Manual')
</script>

<template>
  <div class="flex flex-col gap-4">
    <LoadingState v-if="isLoading" message="Loading tasks…" />

    <ErrorAlert
      v-else-if="accessError"
      :title="accessError.title"
      :message="accessError.message"
    />

    <div
      v-else
      class="flex flex-col gap-4"
    >
      <TaskListToolbar
        :filtered-count="filteredTasks.length"
        :has-active-filters="hasActiveFilters"
        :selected-tags="selectedTags"
        :available-tags="availableTags"
        :sort-mode="sortMode"
        :sort-label="sortLabel"
        :view="view"
        @update:selected-tags="selectedTags = $event"
        @update:sort-mode="sortMode = $event"
        @update:view="view = $event"
      />

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

        <EmptyState
          v-if="groupedTasks.length === 0 && project"
          message="No tasks yet."
        >
          <template #action>
            <p
              v-if="canModify"
              class="mt-1 text-xs"
            >
              Create your first task to get started.
            </p>
          </template>
        </EmptyState>
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