<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Plus, CornerDownRight, Unlink, Link2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusSelect from '@/components/tasks/StatusSelect.vue'
import { useSubtasks } from '@/composables/subtasks/useSubtasks'
import { useCreateSubtask } from '@/composables/subtasks/useCreateSubtask'
import { useConvertToSubtask } from '@/composables/subtasks/useConvertToSubtask'
import { useDetachSubtask } from '@/composables/subtasks/useDetachSubtask'
import { useTasks } from '@/composables/tasks/useTasks'
import { friendlyStatusLabel } from '@/lib/tasks'
import type { Task } from '@/api/tasks'
import type { ProjectStatus } from '@/api/statuses'

const props = defineProps<{
  task: Task
  projectID: string
  statuses: ProjectStatus[]
  canModify: boolean
}>()

const router = useRouter()

const { data: subtasks } = useSubtasks(computed(() => props.task.id))
const { data: projectTasks } = useTasks(computed(() => props.projectID))

const createMutation = useCreateSubtask()
const convertMutation = useConvertToSubtask()
const detachMutation = useDetachSubtask()

const isTopLevel = computed(() => props.task.parentId === null)

const parentOptions = computed(() =>
  (projectTasks.value ?? [])
    .filter((t) => t.id !== props.task.id)
    .map((t) => ({ value: t.id, label: t.name })),
)

const firstStatus = computed(() => {
  if (props.statuses.length > 0) return props.statuses[0]!.status
  return 'todo'
})

const newSubtaskName = ref('')
const newSubtaskStatus = ref('')

function submitSubtask() {
  const name = newSubtaskName.value.trim()
  if (!name) return
  const status = newSubtaskStatus.value || firstStatus.value
  createMutation.mutate(
    {
      parentTaskID: props.task.id,
      projectID: props.projectID,
      input: { name, status },
    },
    {
      onSuccess: () => {
        newSubtaskName.value = ''
        newSubtaskStatus.value = ''
      },
    },
  )
}

function openSubtask(taskID: string) {
  router.push({
    name: 'task-detail',
    params: { projectID: props.projectID, taskID },
  })
}

const showConvertPicker = ref(false)
const selectedParent = ref('')

function startConvert() {
  showConvertPicker.value = true
  selectedParent.value = ''
}

function cancelConvert() {
  showConvertPicker.value = false
  selectedParent.value = ''
}

function confirmConvert() {
  if (!selectedParent.value) return
  convertMutation.mutate(
    {
      taskID: props.task.id,
      parentTaskID: selectedParent.value,
      projectID: props.projectID,
      oldParentID: props.task.parentId,
    },
    { onSuccess: () => { showConvertPicker.value = false; selectedParent.value = '' } },
  )
}

function detach() {
  if (!props.task.parentId) return
  detachMutation.mutate({
    taskID: props.task.id,
    projectID: props.projectID,
    parentTaskID: props.task.parentId,
  })
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5 text-sm font-medium">
      <CornerDownRight class="size-3.5 text-muted-foreground" />
      Subtasks
      <Badge
        v-if="(subtasks?.length ?? 0) > 0"
        variant="secondary"
        class="text-xs"
      >
        {{ subtasks!.length }}
      </Badge>
    </div>

    <div v-if="(subtasks?.length ?? 0) > 0" class="flex flex-col gap-1">
      <div
        v-for="sub in subtasks"
        :key="sub.id"
        class="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm hover:bg-accent/50 cursor-pointer"
        :data-testid="`subtask-${sub.id}`"
        @click="openSubtask(sub.id)"
      >
        <span class="flex-1 truncate">{{ sub.name }}</span>
        <Badge variant="outline" class="text-xs">
          {{ friendlyStatusLabel(sub.status) }}
        </Badge>
      </div>
    </div>

    <p
      v-else
      class="text-xs text-muted-foreground"
    >
      No subtasks.
    </p>

    <div v-if="canModify" class="flex flex-col gap-2">
      <div class="flex items-center gap-1">
        <Input
          v-model="newSubtaskName"
          placeholder="Add subtask…"
          class="h-8 text-sm"
          :data-testid="'subtask-name-input'"
          @keydown="(e: KeyboardEvent) => { if (e.key === 'Enter') submitSubtask() }"
        />
        <StatusSelect
          v-model="newSubtaskStatus"
          :statuses="statuses"
          placeholder="Status"
        />
        <Button
          size="sm"
          class="h-8 shrink-0"
          :disabled="!newSubtaskName.trim() || createMutation.isPending.value"
          :data-testid="'add-subtask-btn'"
          @click="submitSubtask"
        >
          <Loader2 v-if="createMutation.isPending.value" class="size-4 animate-spin" />
          <Plus v-else class="size-4" />
        </Button>
      </div>

      <Separator />

      <div v-if="isTopLevel" class="flex items-center gap-2">
        <template v-if="!showConvertPicker">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 text-xs text-muted-foreground"
            :disabled="parentOptions.length === 0"
            @click="startConvert"
          >
            <Link2 class="mr-1 size-3" />
            Convert to subtask
          </Button>
        </template>
        <template v-else>
          <Select v-model="selectedParent">
            <SelectTrigger class="h-8 flex-1 text-xs">
              <SelectValue placeholder="Select parent task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in parentOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            class="h-8 shrink-0"
            :disabled="!selectedParent || convertMutation.isPending.value"
            :data-testid="'confirm-convert'"
            @click="confirmConvert"
          >
            <Loader2 v-if="convertMutation.isPending.value" class="size-4 animate-spin" />
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 shrink-0"
            @click="cancelConvert"
          >
            Cancel
          </Button>
        </template>
      </div>

      <div v-else class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 text-xs text-muted-foreground"
          :disabled="detachMutation.isPending.value"
          :data-testid="'detach-subtask'"
          @click="detach"
        >
          <Loader2 v-if="detachMutation.isPending.value" class="size-4 animate-spin" />
          <Unlink v-else class="mr-1 size-3" />
          Detach from parent
        </Button>
      </div>
    </div>
  </div>
</template>
