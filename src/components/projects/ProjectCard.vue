<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarClock, Pencil, Trash2 } from '@lucide/vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import UserDisplay from '@/components/UserDisplay.vue'
import type { Project } from '@/api/projects'
import type { User } from '@/api/users'
import { formatDate, formatRelativeDate, isOverdue } from '@/lib/date'

const props = defineProps<{
  project: Project
  owner: User
  canModify?: boolean
  canAdmin?: boolean
}>()

const emit = defineEmits<{
  edit: [project: Project]
  delete: [project: Project]
}>()

const overdue = computed(() => props.project.dueDate && isOverdue(props.project.dueDate))
const hasDescription = computed(() => props.project.description && props.project.description.trim().length > 0)
</script>

<template>
  <Card class="flex flex-col">
    <RouterLink
      :to="`/projects/${project.id}`"
      class="group flex flex-1 flex-col"
    >
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-semibold group-hover:text-primary">
          {{ project.name }}
        </CardTitle>
        <CardDescription
          v-if="hasDescription"
          class="line-clamp-2 text-xs"
        >
          {{ project.description }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-1 flex-col gap-3 pb-2">
        <UserDisplay :user="owner" />
        <div
          v-if="project.dueDate"
          class="flex items-center gap-1.5 text-xs"
          :class="overdue ? 'text-destructive' : 'text-muted-foreground'"
        >
          <CalendarClock class="size-4" data-icon="inline-start" />
          <span>{{ formatDate(project.dueDate) }}</span>
        </div>
      </CardContent>
    </RouterLink>
    <CardFooter class="flex items-center justify-between border-t pt-3">
      <span class="text-xs text-muted-foreground">
        Updated {{ formatRelativeDate(project.updatedAt) }}
      </span>
      <div class="flex items-center gap-1">
        <Button
          v-if="canModify"
          variant="ghost"
          size="icon-sm"
          aria-label="Edit project"
          @click.stop="emit('edit', project)"
        >
          <Pencil />
        </Button>
        <Button
          v-if="canAdmin"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete project"
          class="hover:text-destructive"
          @click.stop="emit('delete', project)"
        >
          <Trash2 class="text-destructive" />
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>
