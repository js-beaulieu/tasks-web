import { ref, watch, type Ref } from 'vue'
import type { DateValue } from 'reka-ui'
import { parseISOToDateValue, dateValueToISO } from '@/lib/date'
import type { Task, UpdateTaskInput } from '@/api/tasks'

export function useTaskEditState(task: Ref<Task | undefined>) {
  const editName = ref('')
  const editDescription = ref('')
  const editProjectId = ref('')
  const editStatus = ref('')
  const editAssigneeId = ref<string>('__none__')
  const editDueDate = ref<DateValue | undefined>()
  const editRecurrence = ref<string | null>(null)
  const dirty = ref(false)

  function resetEditFields(t: Task) {
    editProjectId.value = t.projectId
    editName.value = t.name
    editDescription.value = t.description ?? ''
    editStatus.value = t.status
    editAssigneeId.value = t.assigneeId ?? '__none__'
    editDueDate.value = parseISOToDateValue(t.dueDate)
    editRecurrence.value = t.recurrence
    dirty.value = false
  }

  watch(
    task,
    (t) => {
      if (!t) return
      resetEditFields(t)
    },
    { immediate: true },
  )

  watch(
    [
      editName,
      editDescription,
      editProjectId,
      editStatus,
      editAssigneeId,
      editDueDate,
      editRecurrence,
    ],
    () => {
      if (!task.value) return
      const projectChanged = editProjectId.value !== task.value.projectId
      const nameChanged = editName.value !== task.value.name
      const descChanged = editDescription.value !== (task.value.description ?? '')
      const statusChanged = editStatus.value !== task.value.status
      const assigneeChanged = editAssigneeId.value !== (task.value.assigneeId ?? '__none__')
      const dueDateChanged = dateValueToISO(editDueDate.value) !== (task.value.dueDate ?? undefined)
      const recurrenceChanged = editRecurrence.value !== (task.value.recurrence ?? null)
      dirty.value =
        projectChanged ||
        nameChanged ||
        descChanged ||
        statusChanged ||
        assigneeChanged ||
        dueDateChanged ||
        recurrenceChanged
    },
  )

  function buildUpdateInput(): UpdateTaskInput {
    const input: UpdateTaskInput = {}
    if (!task.value) return input

    if (editProjectId.value !== task.value.projectId) input.projectId = editProjectId.value
    if (editName.value !== task.value.name) input.name = editName.value
    if (editDescription.value !== (task.value.description ?? '')) {
      input.description = editDescription.value || undefined
    }
    if (editStatus.value !== task.value.status) input.status = editStatus.value
    if (editAssigneeId.value !== (task.value.assigneeId ?? '__none__')) {
      input.assigneeId = editAssigneeId.value === '__none__' ? null : editAssigneeId.value
    }
    const newDueDate = dateValueToISO(editDueDate.value)
    if (newDueDate !== (task.value.dueDate ?? undefined)) {
      input.dueDate = newDueDate
    }
    if (editRecurrence.value !== (task.value.recurrence ?? null)) {
      input.recurrence = editRecurrence.value
    }

    return input
  }

  return {
    editName,
    editDescription,
    editProjectId,
    editStatus,
    editAssigneeId,
    editDueDate,
    editRecurrence,
    dirty,
    resetEditFields,
    buildUpdateInput,
  }
}
