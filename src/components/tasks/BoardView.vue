<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import BoardColumn from '@/components/tasks/BoardColumn.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/useUsersByID'
import { friendlyStatusLabel } from '@/lib/tasks'

defineProps<{
  projectID: string
  statuses: ProjectStatus[]
  groupedTasks: { status: string; tasks: Task[] }[]
  usersByID: UsersByIDMap
  canModify: boolean
  dragEnabled: boolean
  dragResetKey?: number
  isAdding?: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  openTask: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
  quickAdd: [status: string, name: string]
  reorder: [taskID: string, newIndex: number, newStatus?: string]
}>()

const scrollContainer = ref<HTMLElement | null>(null)

const defaultCollapsedStatuses = new Set<string>()
const collapsedColumns = ref<Set<string>>(new Set(defaultCollapsedStatuses))

function toggleColumn(status: string) {
  const next = new Set(collapsedColumns.value)
  if (next.has(status)) {
    next.delete(status)
  } else {
    next.add(status)
  }
  collapsedColumns.value = next
}

function friendlyLabel(status: string): string {
  return friendlyStatusLabel(status)
}
</script>

<template>
  <div ref="scrollContainer" class="overflow-x-auto overscroll-x-contain">
    <div class="flex gap-4 pb-4 min-w-max">
      <div
        v-for="group in groupedTasks"
        :key="group.status"
        class="flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-3"
      >
        <div class="flex items-center justify-between">
          <button
            class="flex items-center gap-1.5 text-sm font-semibold"
            @click="toggleColumn(group.status)"
          >
            {{ friendlyLabel(group.status) }}
            <Badge variant="secondary" class="ml-1 text-xs">
              {{ group.tasks.length }}
            </Badge>
          </button>
        </div>

        <div v-if="!collapsedColumns.has(group.status)">
          <BoardColumn
            :status="group.status"
            :tasks="group.tasks"
            :project-i-d="projectID"
            :statuses="statuses"
            :users-by-i-d="usersByID"
            :can-modify="canModify"
            :drag-enabled="dragEnabled"
            :drag-reset-key="dragResetKey"
            :is-adding="isAdding"
            :scroll-container="scrollContainer"
            :tags-by-task="tagsByTask"
            :subtask-counts="subtaskCounts"
            @open-task="emit('openTask', $event)"
            @delete="emit('delete', $event)"
            @move-status="(id, s) => emit('moveStatus', id, s)"
            @reorder="(taskID, position, newStatus) => emit('reorder', taskID, position, newStatus)"
            @quick-add="(status, name) => emit('quickAdd', status, name)"
          />
        </div>

        <button
          v-else
          class="rounded-lg border-2 border-dashed py-4 text-center text-xs text-muted-foreground hover:bg-accent/30"
          @click="toggleColumn(group.status)"
        >
          Expand ({{ group.tasks.length }})
        </button>
      </div>
    </div>
  </div>
</template>