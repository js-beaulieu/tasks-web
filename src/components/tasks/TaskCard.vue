<script setup lang="ts">
import { computed } from 'vue'
import { CalendarClock, RotateCw } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import UserDisplay from '@/components/UserDisplay.vue'
import type { Task } from '@/api/tasks'
import type { UsersByIDMap } from '@/composables/useUsersByID'
import { formatDate, isOverdue } from '@/lib/date'

const props = defineProps<{
  task: Task
  usersByID: UsersByIDMap
  subtaskCount?: number
  tags?: string[]
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
</script>

<template>
  <div class="rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors hover:bg-accent/50">
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
</template>