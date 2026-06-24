<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock, RotateCw, MoreHorizontal, Trash2, GripVertical } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserDisplay from '@/components/UserDisplay.vue'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'
import type { UsersByIDMap } from '@/composables/users/useUsersByID'
import { formatDate, isOverdue } from '@/lib/date'
import { friendlyStatusLabel, formatRecurrence } from '@/lib/tasks'

const props = defineProps<{
  task: Task
  usersByID: UsersByIDMap
  projectID: string
  statuses: ProjectStatus[]
  canModify: boolean
  subtaskCount?: number
  tags?: string[]
  dragEnabled?: boolean
}>()

const emit = defineEmits<{
  openDetail: [taskID: string]
  complete: [taskID: string]
  uncomplete: [taskID: string]
  delete: [taskID: string]
  moveStatus: [taskID: string, status: string]
}>()

const assignee = computed(() => {
  const id = props.task.assigneeId
  return id ? props.usersByID[id] : undefined
})

const overdue = computed(() => props.task.dueDate && isOverdue(props.task.dueDate))

const descriptionExcerpt = computed(() => {
  const d = props.task.description
  if (!d) return ''
  const firstLine = d.split('\n')[0] ?? ''
  return firstLine.length > 120 ? firstLine.slice(0, 117) + '...' : firstLine
})

function openDetail() {
  emit('openDetail', props.task.id)
}

const statusOptions = computed(() =>
  props.statuses.map((s) => s.status),
)
</script>

<template>
  <div
    :data-task-id="task.id"
    class="rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent/50 cursor-pointer group"
    @click="openDetail"
  >
    <div class="flex items-start gap-2">
      <div
        v-if="dragEnabled"
        class="drag-handle mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        @click.stop
      >
        <GripVertical class="size-4" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="font-medium leading-snug">{{ task.name }}</div>
        <p
          v-if="descriptionExcerpt"
          class="mt-1 line-clamp-1 text-xs text-muted-foreground"
        >
          {{ descriptionExcerpt }}
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span v-if="subtaskCount && subtaskCount > 0" class="inline-flex items-center gap-0.5">
            &#9745; {{ subtaskCount }}
          </span>
          <span
            v-if="task.dueDate"
            class="inline-flex items-center gap-0.5"
            :class="overdue ? 'text-destructive' : ''"
          >
            <CalendarClock class="size-3" />
            {{ formatDate(task.dueDate) }}
          </span>
          <span v-if="task.recurrence" class="inline-flex items-center gap-0.5">
            <RotateCw class="size-3" />
            {{ formatRecurrence(task.recurrence) }}
          </span>
          <Badge
            v-for="tag in tags?.slice(0, 3)"
            :key="tag"
            variant="secondary"
            class="text-[10px] leading-none"
          >
            {{ tag }}
          </Badge>
          <span v-if="(tags?.length ?? 0) > 3" class="text-muted-foreground">
            +{{ tags!.length - 3 }}
          </span>
        </div>

        <div v-if="assignee" class="mt-2">
          <UserDisplay :user="assignee" class="scale-90" />
        </div>
      </div>

      <DropdownMenu v-if="canModify">
        <DropdownMenuTrigger
          as-child
          @click.stop
        >
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" @click.stop>
          <DropdownMenuItem @click="openDetail">
            Open details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="s in statusOptions.filter((s) => s !== task.status)"
            :key="s"
            @click="emit('moveStatus', task.id, s)"
          >
            Move to {{ friendlyStatusLabel(s) }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emit('delete', task.id)"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>