<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus } from '@lucide/vue'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import TaskCard from '@/components/tasks/TaskCard.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/useUsersByID'
import { friendlyStatusLabel } from '@/lib/tasks'

const props = defineProps<{
  projectID: string
  statuses: ProjectStatus[]
  groupedTasks: { status: string; tasks: Task[] }[]
  usersByID: UsersByIDMap
  canModify: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  openTask: [taskID: string]
  complete: [taskID: string]
  uncomplete: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
  quickAdd: [status: string, name: string]
}>()

const quickAddStatus = ref<string | null>(null)
const quickAddName = ref('')

function startQuickAdd(status: string) {
  quickAddStatus.value = status
  quickAddName.value = ''
}

function submitQuickAdd(status: string) {
  const name = quickAddName.value.trim()
  if (!name) return
  emit('quickAdd', status, name)
  quickAddName.value = ''
  quickAddStatus.value = null
}

const defaultCollapsedStatuses = new Set(['done', 'cancelled'])
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

const taskTags = computed(() => props.tagsByTask ?? {})
const taskSubtaskCount = computed(() => props.subtaskCounts ?? {})
</script>

<template>
  <ScrollArea class="w-full">
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

        <div v-if="!collapsedColumns.has(group.status)" class="flex flex-col gap-2">
          <TaskCard
            v-for="task in group.tasks"
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

          <div
            v-if="group.tasks.length === 0"
            class="rounded-lg border-2 border-dashed py-8 text-center text-xs text-muted-foreground"
          >
            Drop tasks here
          </div>

          <div v-if="canModify" class="flex flex-col gap-1">
            <div v-if="quickAddStatus === group.status" class="flex items-center gap-1">
              <Input
                v-model="quickAddName"
                placeholder="Task name…"
                class="h-8 text-sm"
                @keydown="(e: KeyboardEvent) => { if (e.key === 'Enter') submitQuickAdd(group.status); if (e.key === 'Escape') quickAddStatus = null }"
              />
              <Button
                size="sm"
                class="h-8 shrink-0"
                :disabled="!quickAddName.trim()"
                @click="submitQuickAdd(group.status)"
              >
                Add
              </Button>
            </div>
            <Button
              v-else
              variant="ghost"
              size="sm"
              class="h-7 text-xs text-muted-foreground"
              @click="startQuickAdd(group.status)"
            >
              <Plus class="mr-1 h-3 w-3" />
              Add task
            </Button>
          </div>
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
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</template>