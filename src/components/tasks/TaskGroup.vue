<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, Plus } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TaskCard from './TaskCard.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/useUsersByID'
import { friendlyStatusLabel } from '@/lib/tasks'

const props = defineProps<{
  status: string
  tasks: Task[]
  usersByID: UsersByIDMap
  projectID: string
  statuses: ProjectStatus[]
  canModify: boolean
  collapsed?: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
  showCheckbox?: boolean
  showQuickAdd?: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: [status: string]
  openTask: [taskID: string]
  complete: [taskID: string]
  uncomplete: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
  quickAdd: [status: string, name: string]
}>()

const taskTags = computed(() => props.tagsByTask ?? {})
const taskSubtaskCount = computed(() => props.subtaskCounts ?? {})

const quickAddOpen = ref(false)
const quickAddName = ref('')

function submitQuickAdd() {
  const name = quickAddName.value.trim()
  if (!name) return
  emit('quickAdd', props.status, name)
  quickAddName.value = ''
}

function startQuickAdd() {
  quickAddOpen.value = true
}

const friendlyLabel = computed(() => friendlyStatusLabel(props.status))
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
      class="flex flex-col gap-2 pl-2"
    >
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
        :show-checkbox="showCheckbox"
        @open-detail="emit('openTask', $event)"
        @complete="emit('complete', $event)"
        @uncomplete="emit('uncomplete', $event)"
        @delete="emit('delete', $event)"
        @move-status="(id, s) => emit('moveStatus', id, s)"
      />
      <p
        v-if="tasks.length === 0 && !quickAddOpen"
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
            @keydown="(e: KeyboardEvent) => { if (e.key === 'Enter') submitQuickAdd(); if (e.key === 'Escape') quickAddOpen = false }"
          />
          <Button size="sm" class="h-8 shrink-0" :disabled="!quickAddName.trim()" @click="submitQuickAdd">
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