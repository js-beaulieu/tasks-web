import { computed, ref } from 'vue'
import { orderBy } from 'es-toolkit'
import type { Ref } from 'vue'
import type { Task } from '@/api/tasks'
import { isOverdue } from '@/lib/date'
import type { TaskSortMode } from '@/stores/ui'

export function useTaskFilters(
  tasks: Ref<Task[] | undefined>,
  tagsByTask: Ref<Record<string, string[]>>,
  sortMode: Ref<TaskSortMode>,
  isManualOrder: Ref<boolean>,
) {
  const selectedTags = ref<string[]>([])

  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    for (const tags of Object.values(tagsByTask.value)) {
      for (const tag of tags) tagSet.add(tag)
    }
    return [...tagSet].sort()
  })

  const hasActiveFilters = computed(() => selectedTags.value.length > 0)

  const sortedTasks = computed(() => {
    const allTasks = tasks.value ?? []
    if (isManualOrder.value) return allTasks

    const terminalStatuses = new Set(['done', 'cancelled'])

    return orderBy(
      allTasks,
      [
        (t: Task) => {
          if (sortMode.value === 'dueDate') {
            if (t.dueDate && isOverdue(t.dueDate)) return 0
            if (t.dueDate) return 1
            return 2
          }
          return 0
        },
        (t: Task) => {
          if (sortMode.value === 'dueDate') {
            if (terminalStatuses.has(t.status)) return t.updatedAt
            return t.dueDate ?? ''
          }
          return 0
        },
      ],
      ['asc', 'asc'],
    )
  })

  const filteredTasks = computed(() => {
    const all = sortedTasks.value
    if (selectedTags.value.length === 0) return all
    return all.filter((t) => {
      const tags = tagsByTask.value[t.id] ?? []
      return selectedTags.value.every((st) => tags.includes(st))
    })
  })

  return {
    selectedTags,
    availableTags,
    hasActiveFilters,
    sortedTasks,
    filteredTasks,
  }
}
