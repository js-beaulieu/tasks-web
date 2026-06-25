import { computed, ref, type Ref } from 'vue'
import { useCreateTask } from '@/composables/tasks/useCreateTask'
import { useUpdateTask } from '@/composables/tasks/useUpdateTask'
import type { Task } from '@/api/tasks'
import type { User } from '@/api/users'

export function useTaskActions(
  projectID: Ref<string>,
  tasks: Ref<Task[] | undefined>,
  me: Ref<User | undefined>,
  doneStatus: Ref<string>,
  firstStatus: Ref<string>,
) {
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const isAdding = computed(() => createMutation.isPending.value)
  const dragResetKey = ref(0)

  function handleQuickAdd(status: string, name: string) {
    createMutation.mutate({
      projectID: projectID.value,
      input: {
        name,
        status,
        assigneeId: me.value?.id,
      },
    })
  }

  function handleCompleteTask(taskID: string) {
    updateMutation.mutate(
      {
        taskID,
        input: { status: doneStatus.value },
      },
      {
        onError: () => {
          dragResetKey.value++
        },
      },
    )
  }

  function handleUncompleteTask(taskID: string) {
    updateMutation.mutate({
      taskID,
      input: { status: firstStatus.value },
    })
  }

  function handleMoveStatus(taskID: string, status: string) {
    updateMutation.mutate(
      { taskID, input: { status } },
      {
        onError: () => {
          dragResetKey.value++
        },
      },
    )
  }

  function handleReorder(taskID: string, newIndex: number, newStatus?: string) {
    const input: { position: number; status?: string } = { position: newIndex }
    if (newStatus) input.status = newStatus
    updateMutation.mutate(
      { taskID, input },
      {
        onError: () => {
          dragResetKey.value++
        },
      },
    )
  }

  const deleteTaskID = ref<string | null>(null)
  const deleteTaskObj = computed<Task | null>(() => {
    if (!deleteTaskID.value) return null
    return (tasks.value ?? []).find((t) => t.id === deleteTaskID.value) ?? null
  })

  function handleDeleteTask(taskID: string) {
    deleteTaskID.value = taskID
  }

  return {
    createMutation,
    updateMutation,
    isAdding,
    dragResetKey,
    deleteTaskID,
    deleteTaskObj,
    handleQuickAdd,
    handleCompleteTask,
    handleUncompleteTask,
    handleMoveStatus,
    handleReorder,
    handleDeleteTask,
  }
}