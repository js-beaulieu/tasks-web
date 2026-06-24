<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import TaskCard from '@/components/tasks/TaskCard.vue'
import QuickAddInput from '@/components/shared/QuickAddInput.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/users/useUsersByID'
import { useDraggableTasks } from '@/composables/tasks/useDraggableTasks'

const props = defineProps<{
  status: string
  tasks: Task[]
  projectID: string
  statuses: ProjectStatus[]
  usersByID: UsersByIDMap
  canModify: boolean
  dragEnabled: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
  dragResetKey?: number
  isAdding?: boolean
  scrollContainer?: HTMLElement | null
}>()

const emit = defineEmits<{
  openTask: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
  reorder: [taskID: string, newIndex: number, newStatus?: string]
  quickAdd: [status: string, name: string]
}>()

const scrollOpts = computed(() => {
  const opts: Record<string, unknown> = {
    scrollSensitivity: 80,
    scrollSpeed: 10,
  }
  if (props.scrollContainer) {
    opts.scroll = props.scrollContainer
  }
  return opts
})

const taskTags = computed(() => props.tagsByTask ?? {})
const taskSubtaskCount = computed(() => props.subtaskCounts ?? {})
const tasksKey = computed(() => props.tasks.map((t) => t.id).join(','))

const columnGroup = computed(() =>
  props.dragEnabled
    ? { name: 'board-tasks', pull: true, put: true }
    : { name: 'board-tasks', pull: false, put: false },
)

const { localTasks, onStart, onEnd, onAdd } = useDraggableTasks(
  {
    tasks: computed(() => props.tasks),
    dragResetKey: computed(() => props.dragResetKey),
    readStatus: (el: HTMLElement) => el.getAttribute('data-status'),
  },
  (_e, taskID, newIndex, newStatus) => {
    if (newStatus !== undefined) emit('reorder', taskID, newIndex, newStatus)
    else emit('reorder', taskID, newIndex)
  },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <VueDraggable
      v-if="dragEnabled"
      :key="tasksKey"
      v-model="localTasks"
      :group="columnGroup"
      :animation="150"
      :handle="'.drag-handle'"
      :delay="100"
      :delay-on-touch-only="true"
      v-bind="scrollOpts"
      :data-status="status"
      item-key="id"
      class="flex flex-col gap-2 min-h-16"
      @start="onStart"
      @end="onEnd"
      @add="onAdd"
    >
      <TaskCard
        v-for="task in localTasks"
        :key="task.id"
        :task="task"
        :users-by-i-d="usersByID"
        :project-i-d="projectID"
        :statuses="statuses"
        :can-modify="canModify"
        :drag-enabled="dragEnabled"
        :tags="taskTags[task.id]"
        :subtask-count="taskSubtaskCount[task.id]"
        @open-detail="emit('openTask', $event)"
        @delete="emit('delete', $event)"
        @move-status="(id, s) => emit('moveStatus', id, s)"
      />
      <div
        v-if="localTasks.length === 0"
        class="rounded-lg border-2 border-dashed py-8 text-center text-xs text-muted-foreground"
      >
        Drop here
      </div>
    </VueDraggable>
    <template v-else>
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :users-by-i-d="usersByID"
        :project-i-d="projectID"
        :statuses="statuses"
        :can-modify="canModify"
        :tags="taskTags[task.id]"
        :subtask-count="taskSubtaskCount[task.id]"
        @open-detail="emit('openTask', $event)"
        @delete="emit('delete', $event)"
        @move-status="(id, s) => emit('moveStatus', id, s)"
      />
    </template>

    <div
      v-if="!dragEnabled && tasks.length === 0"
      class="rounded-lg border-2 border-dashed py-8 text-center text-xs text-muted-foreground"
    >
      No tasks
    </div>

    <div v-if="canModify">
      <QuickAddInput
        :is-pending="isAdding"
        @submit="(name: string) => emit('quickAdd', status, name)"
      />
    </div>
  </div>
</template>