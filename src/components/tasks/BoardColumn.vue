<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Loader2, Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TaskCard from '@/components/tasks/TaskCard.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/useUsersByID'

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

const localTasks = ref<Task[]>([])

watch(
  [() => props.tasks, () => props.dragResetKey],
  ([tasks]) => {
    localTasks.value = [...tasks]
  },
  { immediate: true },
)

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

let draggedTaskId: string | null = null

const columnGroup = computed(() =>
  props.dragEnabled
    ? { name: 'board-tasks', pull: true, put: true }
    : { name: 'board-tasks', pull: false, put: false },
)

function onStart(evt: { item: HTMLElement }) {
  document.body.classList.add('sortable-dragging')
  draggedTaskId = evt.item.dataset.taskId ?? evt.item.dataset.id ?? null
}

function onEnd(evt: { from: HTMLElement; to: HTMLElement; newIndex?: number }) {
  document.body.classList.remove('sortable-dragging')
  const fromStatus = evt.from.getAttribute('data-status')
  const toStatus = evt.to.getAttribute('data-status')
  if (fromStatus && toStatus && fromStatus === toStatus && evt.newIndex != null && draggedTaskId) {
    emit('reorder', draggedTaskId, evt.newIndex)
  }
  if (fromStatus !== toStatus) {
    if (draggedTaskId) {
      localTasks.value = localTasks.value.filter((t) => t.id !== draggedTaskId)
    }
    draggedTaskId = null
    return
  }
  draggedTaskId = null
}

function onAdd(evt: { newIndex?: number; newDraggableIndex?: number; to: HTMLElement; item?: HTMLElement }) {
  document.body.classList.remove('sortable-dragging')
  const toStatus = evt.to.getAttribute('data-status')
  const taskId = evt.item?.dataset?.taskId ?? evt.item?.dataset?.id ?? draggedTaskId
  if (!toStatus || !taskId) {
    localTasks.value = [...props.tasks]
    draggedTaskId = null
    return
  }
  const idx = evt.newDraggableIndex ?? evt.newIndex ?? 0
  emit('reorder', taskId, idx, toStatus)
  draggedTaskId = null
}

const quickAddName = ref('')
const quickAddOpen = ref(false)
const quickAddHasText = ref(false)

function onQuickAddInput(e: Event) {
  quickAddName.value = (e.target as HTMLInputElement).value
  quickAddHasText.value = quickAddName.value.trim().length > 0
}

function submitQuickAdd() {
  const name = quickAddName.value.trim()
  if (!name) return
  emit('quickAdd', props.status, name)
  quickAddName.value = ''
  quickAddHasText.value = false
  quickAddOpen.value = false
}
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

    <div v-if="canModify" class="flex flex-col gap-1">
      <div v-if="quickAddOpen" class="flex items-center gap-1">
        <Input
          v-model="quickAddName"
          placeholder="Task name…"
          class="h-8 text-sm"
          @input="onQuickAddInput"
          @keydown="(e: KeyboardEvent) => { if (e.key === 'Enter') submitQuickAdd(); if (e.key === 'Escape') quickAddOpen = false }"
        />
        <Button
          class="h-8 shrink-0"
          :disabled="!quickAddHasText || isAdding"
          @click="submitQuickAdd"
        >
          <Loader2 v-if="isAdding" class="size-4 animate-spin" />
          Add
        </Button>
      </div>
      <Button
        v-else
        variant="ghost"
        size="sm"
        class="h-7 text-xs text-muted-foreground"
        @click="quickAddOpen = true"
      >
        <Plus class="mr-1 h-3 w-3" />
        Add task
      </Button>
    </div>
  </div>
</template>