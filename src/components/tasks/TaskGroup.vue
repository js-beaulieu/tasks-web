<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, ChevronRight, Loader2, Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaskCard from './TaskCard.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/users/useUsersByID'
import { friendlyStatusLabel } from '@/lib/tasks'

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

const localTasks = ref<Task[]>([])

watch(
  [() => props.tasks, () => props.dragResetKey],
  ([tasks]) => {
    localTasks.value = [...tasks]
  },
  { immediate: true },
)

const quickAddOpen = ref(false)
const quickAddName = ref('')
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
}

function startQuickAdd() {
  quickAddOpen.value = true
}

const friendlyLabel = computed(() => friendlyStatusLabel(props.status))

let draggedTaskId: string | null = null

function onStart(evt: { item: HTMLElement }) {
  document.body.classList.add('sortable-dragging')
  draggedTaskId = evt.item.dataset.taskId ?? evt.item.dataset.id ?? null
}

function onEnd(evt: { from: HTMLElement; to: HTMLElement; newIndex?: number }) {
  document.body.classList.remove('sortable-dragging')
  const fromStatus = (evt.from.closest('[data-status]') as HTMLElement | null)?.getAttribute('data-status')
  const toStatus = (evt.to.closest('[data-status]') as HTMLElement | null)?.getAttribute('data-status')
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
  const toStatus = (evt.to.closest('[data-status]') as HTMLElement | null)?.getAttribute('data-status')
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

    <div
      v-if="!collapsed"
      :data-status="status"
      class="flex flex-col gap-2 pl-2"
    >
      <VueDraggable
        v-if="dragEnabled"
        :key="dragResetKey"
        v-model="localTasks"
        :group="dragEnabled ? { name: 'vertical-tasks', pull: true, put: true } : { name: 'vertical-tasks', pull: false, put: false }"
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
        v-if="!dragEnabled && tasks.length === 0 && !quickAddOpen"
        class="py-4 text-center text-xs text-muted-foreground"
      >
        No tasks
      </p>

      <div v-if="canModify && showQuickAdd" class="flex flex-col gap-1">
        <div v-if="quickAddOpen" class="flex items-center gap-1">
          <Input
            v-model="quickAddName"
            placeholder="Task name…"
            class="h-8 text-sm"
            @input="onQuickAddInput"
            @keydown="(e: KeyboardEvent) => { if (e.key === 'Enter') submitQuickAdd(); if (e.key === 'Escape') quickAddOpen = false }"
          />
          <Button class="h-8 shrink-0" :disabled="!quickAddHasText || isAdding" @click="submitQuickAdd">
            <Loader2 v-if="isAdding" class="size-4 animate-spin" />
            Add
          </Button>
        </div>
        <Button
          v-else
          variant="ghost"
          size="sm"
          class="h-7 text-xs text-muted-foreground"
          @click="startQuickAdd"
        >
          <Plus class="mr-1 h-3 w-3" />
          Add task
        </Button>
      </div>
    </div>
  </div>
</template>