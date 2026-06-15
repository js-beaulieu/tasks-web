<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock, RotateCw, MoreHorizontal, Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { UsersByIDMap } from '@/composables/useUsersByID'
import { formatDate, isOverdue } from '@/lib/date'
import { friendlyStatusLabel } from '@/lib/tasks'

const props = defineProps<{
  task: Task
  usersByID: UsersByIDMap
  projectID: string
  statuses: ProjectStatus[]
  canModify: boolean
  subtaskCount?: number
  tags?: string[]
  showCheckbox?: boolean
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

const isIncomplete = computed(() => {
  return props.task.status !== 'done' && props.task.status !== 'cancelled'
})

function onCheckboxChange(checked: boolean | 'indeterminate') {
  if (checked === true) {
    emit('complete', props.task.id)
  } else {
    emit('uncomplete', props.task.id)
  }
}

function openDetail() {
  emit('openDetail', props.task.id)
}

const statusOptions = computed(() =>
  props.statuses.map((s) => s.status),
)
</script>

<template>
  <div
    class="rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent/50 cursor-pointer group"
    @click="openDetail"
  >
    <div class="flex items-start gap-2">
      <Checkbox
        v-if="showCheckbox && isIncomplete && canModify"
        :checked="false"
        class="mt-0.5 shrink-0"
        @update:checked="onCheckboxChange"
        @click.stop
      />
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