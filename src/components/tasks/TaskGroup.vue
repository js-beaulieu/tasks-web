<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Badge } from '@/components/ui/badge'
import TaskCard from './TaskCard.vue'
import QuickAddInput from '@/components/shared/QuickAddInput.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/users/useUsersByID'
import { friendlyStatusLabel } from '@/lib/tasks'
import { useDraggableTasks } from '@/composables/tasks/useDraggableTasks'

const props = defineProps<{
  status: string
  tasks: Task[]
  usersByID: UsersByIDMap
  projectID: string
  statuses: ProjectStatus[]
  canModify: boolean
  collapsed?: boolean
  dragEnabled: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
  showQuickAdd?: boolean
  dragResetKey?: number
  isAdding?: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: [status: string]
  openTask: [taskID: string]
  complete: [taskID: string]
  uncomplete: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
  quickAdd: [status: string, name: string]
  reorder: [taskID: string, newIndex: number, newStatus?: string]
}>()

const taskTags = computed(() => props.tagsByTask ?? {})
const taskSubtaskCount = computed(() => props.subtaskCounts ?? {})
const friendlyLabel = computed(() => friendlyStatusLabel(props.status))

const { localTasks, onStart, onEnd, onAdd } = useDraggableTasks(
  {
    tasks: computed(() => props.tasks),
    dragResetKey: computed(() => props.dragResetKey),
    readStatus: (el: HTMLElement) =>
      el.closest('[data-status]')?.getAttribute('data-status') ?? null,
  },
  (_e, taskID, newIndex, newStatus) => {
    if (newStatus !== undefined) emit('reorder', taskID, newIndex, newStatus)
    else emit('reorder', taskID, newIndex)
  },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      class="flex items-center gap-1.5 text-sm font-semibold"
      @click="emit('toggleCollapse', status)"
    >
      <component :is="collapsed ? ChevronRight : ChevronDown" class="size-4" />
      {{ friendlyLabel }}
      <Badge variant="secondary" class="ml-1 text-xs">
        {{ tasks.length }}
      </Badge>
    </button>

    <div v-if="!collapsed" :data-status="status" class="flex flex-col gap-2 pl-2">
      <VueDraggable
        v-if="dragEnabled"
        :key="dragResetKey"
        v-model="localTasks"
        :group="{ name: 'vertical-tasks', pull: true, put: true }"
        :animation="150"
        :handle="'.drag-handle'"
        :delay="100"
        :delay-on-touch-only="true"
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
          @complete="emit('complete', $event)"
          @uncomplete="emit('uncomplete', $event)"
          @delete="emit('delete', $event)"
          @move-status="(id, s) => emit('moveStatus', id, s)"
        />
        <div
          v-if="localTasks.length === 0"
          class="rounded-lg border-2 border-dashed py-4 text-center text-xs text-muted-foreground"
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
          @complete="emit('complete', $event)"
          @uncomplete="emit('uncomplete', $event)"
          @delete="emit('delete', $event)"
          @move-status="(id, s) => emit('moveStatus', id, s)"
        />
      </template>
      <p
        v-if="!dragEnabled && tasks.length === 0"
        class="py-4 text-center text-xs text-muted-foreground"
      >
        No tasks
      </p>

      <div v-if="canModify && showQuickAdd">
        <QuickAddInput
          :is-pending="isAdding"
          @submit="(name: string) => emit('quickAdd', status, name)"
        />
      </div>
    </div>
  </div>
</template>
