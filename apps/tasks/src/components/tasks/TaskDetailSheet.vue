<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { uniq } from 'es-toolkit'
import { toast } from 'vue-sonner'
import { RotateCw, Trash2, Pencil, X } from '@lucide/vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarClock } from '@lucide/vue'
import { format } from 'date-fns'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import TaskDeleteDialog from '@/components/tasks/TaskDeleteDialog.vue'
import TaskTagsSection from '@/components/tasks/TaskTagsSection.vue'
import TaskSubtasksSection from '@/components/tasks/TaskSubtasksSection.vue'
import RecurrencePicker from '@/components/tasks/RecurrencePicker.vue'
import StatusSelect from '@/components/tasks/StatusSelect.vue'
import UserDisplay from '@/components/UserDisplay.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import { useProjects } from '@/composables/projects/useProjects'
import { useTask } from '@/composables/tasks/useTask'
import { useProject } from '@/composables/projects/useProject'
import { useUpdateTask } from '@/composables/tasks/useUpdateTask'
import { useStatuses } from '@/composables/statuses/useStatuses'
import { useMembers } from '@/composables/members/useMembers'
import { useUsersByID } from '@/composables/users/useUsersByID'
import { useProjectPermissions } from '@/composables/projects/useProjectPermissions'
import { useTaskEditState } from '@/composables/tasks/useTaskEditState'
import { formatDate, formatRelativeDate, isOverdue, dateValueToISO } from '@/lib/date'
import { friendlyStatusLabel, formatRecurrence } from '@/lib/tasks'
import type { UpdateTaskInput } from '@/api/tasks'

const route = useRoute()
const router = useRouter()

const projectID = computed(() => route.params.projectID as string)
const taskID = computed(() => route.params.taskID as string | undefined)
const open = computed(() => !!taskID.value)

const { data: task, isLoading } = useTask(taskID)
const { data: project } = useProject(projectID)
const { data: projects } = useProjects()
const { data: statuses } = useStatuses(projectID)
const { data: members } = useMembers(projectID)

const userIDs = computed(() => {
  const ids: string[] = []
  if (task.value) {
    ids.push(task.value.ownerId)
    if (task.value.assigneeId) ids.push(task.value.assigneeId)
  }
  for (const m of members.value ?? []) ids.push(m.userId)
  return uniq(ids)
})
const { data: usersByID } = useUsersByID(userIDs)
const { canModify } = useProjectPermissions(project)

const editing = ref(false)
const deleteDialogOpen = ref(false)
const moveConfirmationOpen = ref(false)
const pendingMoveConfirmation = ref<UpdateTaskInput | null>(null)

const {
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
} = useTaskEditState(task)

const updateMutation = useUpdateTask()

const projectOptions = computed(() =>
  (projects.value ?? [])
    .filter(
      (entry) =>
        entry.id === projectID.value ||
        entry.effectiveRole === 'modify' ||
        entry.effectiveRole === 'admin',
    )
    .map((entry) => ({ value: entry.id, label: entry.name })),
)

const memberOptions = computed(() => {
  const opts = [{ value: '__none__', label: 'Unassigned' }]
  for (const m of members.value ?? []) {
    const user = usersByID.value?.[m.userId]
    opts.push({ value: m.userId, label: user?.name ?? m.userId })
  }
  return opts
})

const owner = computed(() => (task.value ? usersByID.value?.[task.value.ownerId] : undefined))
const assignee = computed(() =>
  task.value?.assigneeId ? usersByID.value?.[task.value.assigneeId] : undefined,
)
const currentStatusLabel = computed(() =>
  task.value ? friendlyStatusLabel(task.value.status) : '',
)
const dueDateLabel = computed(() => (task.value?.dueDate ? formatDate(task.value.dueDate) : 'None'))
const dueDateOverdue = computed(() => (task.value?.dueDate ? isOverdue(task.value.dueDate) : false))
const formattedEditDueDate = computed(() => {
  if (!editDueDate.value) return ''
  return format(
    new Date(editDueDate.value.year, editDueDate.value.month - 1, editDueDate.value.day),
    'MMM d, yyyy',
  )
})

function handleMoveSuccess(updatedProjectID: string, updatedTaskID: string) {
  const targetProjectName =
    projectOptions.value.find((option) => option.value === updatedProjectID)?.label ??
    'target project'
  dirty.value = false
  editing.value = false
  close()
  toast.success('Task moved', {
    description: `Moved to ${targetProjectName}. Status and assignee were adjusted if the target project required it.`,
    action: {
      label: 'Open task',
      onClick: () => {
        void router.push({
          name: 'task-detail',
          params: { projectID: updatedProjectID, taskID: updatedTaskID },
        })
      },
    },
  })
}

function commitSave(input: UpdateTaskInput) {
  if (!task.value) return
  updateMutation.mutate(
    { taskID: task.value.id, input, sourceProjectID: projectID.value },
    {
      onSuccess: (data) => {
        const updated = data.task
        moveConfirmationOpen.value = false
        pendingMoveConfirmation.value = null
        if (updated.projectId !== projectID.value) {
          handleMoveSuccess(updated.projectId, updated.id)
          return
        }
        dirty.value = false
        editing.value = false
      },
      onError: () => {
        moveConfirmationOpen.value = false
        pendingMoveConfirmation.value = null
      },
    },
  )
}

function save() {
  if (!task.value || !dirty.value) return
  const input = buildUpdateInput()
  if (input.recurrence && !input.dueDate && !task.value.dueDate) {
    toast.error('Recurring tasks require a due date')
    return
  }
  if (input.projectId && input.projectId !== task.value.projectId) {
    pendingMoveConfirmation.value = input
    moveConfirmationOpen.value = true
    return
  }
  commitSave(input)
}

function startEditing() {
  if (!task.value) return
  resetEditFields(task.value)
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  moveConfirmationOpen.value = false
  pendingMoveConfirmation.value = null
  if (task.value) resetEditFields(task.value)
}

function confirmMove() {
  const input = pendingMoveConfirmation.value
  if (!input) return
  moveConfirmationOpen.value = false
  commitSave(input)
}

function close() {
  router.push({ name: 'project-detail', params: { projectID: projectID.value } })
}
</script>

<template>
  <Sheet
    :open="open"
    @update:open="
      (v: boolean) => {
        if (!v) close()
      }
    "
  >
    <SheetContent side="right" class="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Task Details</SheetTitle>
        <SheetDescription v-if="isLoading">Loading task…</SheetDescription>
      </SheetHeader>

      <LoadingState v-if="isLoading" />

      <div v-else-if="task" class="flex flex-col gap-4 px-4 pb-6">
        <!-- Read view -->
        <template v-if="!editing">
          <div class="flex items-start justify-between gap-2">
            <h2 class="text-lg font-semibold leading-tight">{{ task.name }}</h2>
            <Button
              v-if="canModify"
              variant="outline"
              size="sm"
              class="shrink-0"
              @click="startEditing"
            >
              <Pencil class="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <p v-if="task.description" class="whitespace-pre-wrap text-sm text-muted-foreground">
            {{ task.description }}
          </p>

          <Separator />

          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <span class="text-muted-foreground">Status</span>
            <span class="font-medium">{{ currentStatusLabel }}</span>

            <span class="text-muted-foreground">Assignee</span>
            <span>
              <UserDisplay v-if="assignee" :user="assignee" class="scale-90" />
              <span v-else class="text-muted-foreground">Unassigned</span>
            </span>

            <span class="text-muted-foreground">Due date</span>
            <span :class="dueDateOverdue ? 'text-destructive font-medium' : ''">
              {{ dueDateLabel }}
            </span>

            <span v-if="task.recurrence" class="text-muted-foreground">Recurrence</span>
            <span v-if="task.recurrence" class="flex items-center gap-2">
              <RotateCw class="h-3.5 w-3.5" />
              {{ formatRecurrence(task.recurrence) }}
            </span>
          </div>

          <Separator />

          <div class="flex flex-col gap-2 text-xs text-muted-foreground">
            <div v-if="owner" class="flex items-center gap-2">
              <span>Owner:</span>
              <UserDisplay :user="owner" class="scale-75 origin-left" />
            </div>
            <span>Created: {{ formatRelativeDate(task.createdAt) }}</span>
            <span>Updated: {{ formatRelativeDate(task.updatedAt) }}</span>
          </div>

          <Separator />

          <div class="flex items-center gap-2">
            <Button
              v-if="canModify"
              variant="destructive"
              size="sm"
              @click="deleteDialogOpen = true"
            >
              <Trash2 class="mr-1 h-4 w-4" />
              Delete
            </Button>
            <div class="flex-1" />
            <Button variant="outline" size="sm" @click="close">
              <X class="mr-1 h-4 w-4" />
              Close
            </Button>
          </div>
        </template>

        <!-- Edit view -->
        <template v-else>
          <div class="flex flex-col gap-2">
            <Label for="task-name">Name</Label>
            <Input id="task-name" v-model="editName" />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="task-desc">Description</Label>
            <Textarea id="task-desc" v-model="editDescription" rows="4" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Project</Label>
            <Select v-model="editProjectId">
              <SelectTrigger class="w-full"
                ><SelectValue placeholder="Select project"
              /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in projectOptions" :key="opt.value" :value="opt.value">{{
                  opt.label
                }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-2">
            <Label>Status</Label>
            <StatusSelect v-model="editStatus" :statuses="statuses ?? []" />
          </div>

          <div class="flex flex-col gap-2">
            <Label>Assignee</Label>
            <Select v-model="editAssigneeId">
              <SelectTrigger class="w-full"
                ><SelectValue placeholder="Select assignee"
              /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in memberOptions" :key="opt.value" :value="opt.value">{{
                  opt.label
                }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="flex flex-col gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button variant="outline" class="w-full justify-start text-left font-normal">
                  <CalendarClock class="mr-2 h-4 w-4" />
                  <span v-if="editDueDate">{{ formattedEditDueDate }}</span>
                  <span v-else class="text-muted-foreground">Pick a date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar v-model="editDueDate" :week-starts-on="1" />
                <div class="border-t p-2">
                  <Button variant="ghost" size="sm" class="w-full" @click="editDueDate = undefined"
                    >Clear date</Button
                  >
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <RecurrencePicker
            :model-value="editRecurrence"
            :due-date="dateValueToISO(editDueDate) ?? task.dueDate"
            data-testid="recurrence-picker"
            @update:model-value="(v: string | null) => (editRecurrence = v)"
          />

          <Separator />

          <div class="flex items-center justify-between gap-2">
            <Button variant="destructive" size="sm" @click="deleteDialogOpen = true">
              <Trash2 class="mr-1 h-4 w-4" />
              Delete
            </Button>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" @click="cancelEditing">Cancel</Button>
              <Button size="sm" :disabled="!dirty" @click="save">Save</Button>
            </div>
          </div>
        </template>

        <Separator />

        <TaskTagsSection :task-i-d="task.id" :can-modify="canModify" />

        <Separator />

        <TaskSubtasksSection
          :task="task"
          :project-i-d="projectID"
          :statuses="statuses ?? []"
          :can-modify="canModify"
        />

        <TaskDeleteDialog
          :open="deleteDialogOpen"
          :task="task"
          :project-i-d="projectID"
          @update:open="deleteDialogOpen = $event"
          @deleted="close"
        />

        <ConfirmDialog
          :open="moveConfirmationOpen"
          title="Move task to another project?"
          confirm-label="Move task"
          @update:open="moveConfirmationOpen = $event"
          @confirm="confirmMove"
        >
          <template #description>
            The task will stay closed on this project page after the move. If the target project
            does not support the current status, it will fall back to that project's first status.
            If the current assignee is not a member of the target project, the task will be
            reassigned to the target project's owner.
          </template>
        </ConfirmDialog>
      </div>
    </SheetContent>
  </Sheet>
</template>
