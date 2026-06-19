import { useQueries } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { listTaskTags, listSubtasks, type Task } from '@/api/tasks'

export function useTaskCardMetadata(
  taskIDs: MaybeRef<string[]>,
) {
  const ids = computed(() => toValue(taskIDs))

  const tagQueries = useQueries({
    queries: computed(() =>
      ids.value.map((id) => ({
        queryKey: ['tasks', id, 'tags'] as const,
        queryFn: () => listTaskTags(id),
        placeholderData: (prev: string[] | undefined) => prev ?? [],
      })),
    ),
  })

  const subtaskQueries = useQueries({
    queries: computed(() =>
      ids.value.map((id) => ({
        queryKey: ['tasks', id, 'subtasks'] as const,
        queryFn: () => listSubtasks(id),
        placeholderData: (prev: Task[] | undefined) => prev ?? [],
      })),
    ),
  })

  const tagsByTask = computed<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    ids.value.forEach((id, i) => {
      const tags = tagQueries.value[i]?.data
      if (tags && tags.length > 0) map[id] = tags
    })
    return map
  })

  const subtaskCounts = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    ids.value.forEach((id, i) => {
      const subtasks = subtaskQueries.value[i]?.data
      if (subtasks && subtasks.length > 0) map[id] = subtasks.length
    })
    return map
  })

  return { tagsByTask, subtaskCounts }
}
