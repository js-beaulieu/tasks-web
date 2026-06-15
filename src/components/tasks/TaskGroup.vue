<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import TaskCard from './TaskCard.vue'
import type { Task } from '@/api/tasks'
import type { UsersByIDMap } from '@/composables/useUsersByID'

const props = defineProps<{
  status: string
  tasks: Task[]
  usersByID: UsersByIDMap
  collapsed?: boolean
  tagsByTask?: Record<string, string[]>
  subtaskCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  'toggle-collapse': [status: string]
}>()

const taskTags = computed(() => props.tagsByTask ?? {})
const taskSubtaskCount = computed(() => props.subtaskCounts ?? {})
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      class="flex items-center gap-1.5 text-sm font-semibold"
      @click="emit('toggle-collapse', status)"
    >
      <component :is="collapsed ? ChevronRight : ChevronDown" class="size-4" />
      {{ status }}
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
        :tags="taskTags[task.id]"
        :subtask-count="taskSubtaskCount[task.id]"
      />
      <p
        v-if="tasks.length === 0"
        class="py-4 text-center text-xs text-muted-foreground"
      >
        No tasks
      </p>
    </div>
  </div>
</template>