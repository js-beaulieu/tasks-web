import { computed, type Ref } from 'vue'
import { groupBy, uniq } from 'es-toolkit'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'

export function useTaskGroups(
  filteredTasks: Ref<Task[]>,
  statuses: Ref<ProjectStatus[] | undefined>,
) {
  const groupedTasks = computed(() => {
    const statusOrder: string[] = (statuses.value ?? []).map((s: ProjectStatus) => s.status)
    const defaultStatuses = ['todo', 'in_progress', 'done']
    const allStatuses = uniq([...statusOrder, ...defaultStatuses])

    const grouped = groupBy(filteredTasks.value, (t) => t.status)

    return allStatuses
      .filter((s) => statusOrder.includes(s) || (grouped[s]?.length ?? 0) > 0)
      .map((status) => ({
        status,
        tasks: grouped[status] ?? [],
      }))
  })

  const doneStatus = computed(() => {
    const statusList = statuses.value ?? []
    const done = statusList.find((s) => s.status === 'done')
    return done ? done.status : 'done'
  })

  const firstStatus = computed(() => {
    const statusList = statuses.value ?? []
    if (statusList.length > 0) return statusList[0]!.status
    return 'todo'
  })

  return { groupedTasks, doneStatus, firstStatus }
}
