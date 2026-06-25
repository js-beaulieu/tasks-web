<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2, Plus, Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { useStatuses } from '@/composables/statuses/useStatuses'
import { useCreateStatus } from '@/composables/statuses/useCreateStatus'
import { useDeleteStatus } from '@/composables/statuses/useDeleteStatus'
import { friendlyStatusLabel } from '@/lib/tasks'
import { ApiError } from '@/api/client'

const props = defineProps<{
  projectID: string
  canAdmin: boolean
}>()

const { data: statuses } = useStatuses(computed(() => props.projectID))

const createStatusMutation = useCreateStatus()
const deleteStatusMutation = useDeleteStatus()

const addStatusOpen = ref(false)
const newStatusValue = ref('')
const conflictStatus = ref<string | null>(null)

function startAddStatus() {
  newStatusValue.value = ''
  conflictStatus.value = null
  addStatusOpen.value = true
}

function cancelAddStatus() {
  addStatusOpen.value = false
  newStatusValue.value = ''
  conflictStatus.value = null
}

const existingStatusSet = computed(() => {
  const set = new Set<string>()
  for (const s of statuses.value ?? []) {
    set.add(s.status.toLowerCase())
  }
  return set
})

const newStatusHasText = computed(() => newStatusValue.value.trim().length > 0)
const newStatusDuplicate = computed(
  () =>
    newStatusHasText.value &&
    existingStatusSet.value.has(newStatusValue.value.trim().toLowerCase()),
)

async function submitNewStatus() {
  const status = newStatusValue.value.trim()
  if (!status || newStatusDuplicate.value) return
  conflictStatus.value = null
  await createStatusMutation.mutateAsync(
    { projectID: props.projectID, status },
    {
      onSuccess: () => {
        addStatusOpen.value = false
        newStatusValue.value = ''
      },
      onError: (error) => {
        if (error instanceof ApiError && error.problem.status === 409) {
          conflictStatus.value = status
        }
      },
    },
  )
}

const deleteStatusTarget = ref<string | null>(null)
const deleteStatusConflict = ref<string | null>(null)

function startDeleteStatus(status: string) {
  deleteStatusTarget.value = status
  deleteStatusConflict.value = null
}

function cancelDeleteStatus() {
  deleteStatusTarget.value = null
  deleteStatusConflict.value = null
}

async function confirmDeleteStatus() {
  if (!deleteStatusTarget.value) return
  deleteStatusConflict.value = null
  await deleteStatusMutation.mutateAsync(
    { projectID: props.projectID, status: deleteStatusTarget.value },
    {
      onSuccess: () => {
        deleteStatusTarget.value = null
      },
      onError: (error) => {
        if (error instanceof ApiError && error.problem.status === 409) {
          deleteStatusConflict.value = deleteStatusTarget.value
        }
      },
    },
  )
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold">Statuses</h3>
      <Button
        v-if="canAdmin && !addStatusOpen"
        variant="ghost"
        size="sm"
        class="h-7 text-xs text-muted-foreground"
        @click="startAddStatus"
      >
        <Plus class="mr-1 h-3 w-3" />
        Add status
      </Button>
    </div>

    <div v-if="addStatusOpen" class="flex flex-col gap-2">
      <div class="flex items-center gap-1">
        <Input
          v-model="newStatusValue"
          placeholder="Status value (e.g. review, blocked)…"
          class="h-8 text-sm"
          :disabled="createStatusMutation.isPending.value"
          @keydown="
            (e: KeyboardEvent) => {
              if (e.key === 'Enter') submitNewStatus()
              if (e.key === 'Escape') cancelAddStatus()
            }
          "
        />
        <Button
          class="h-8 shrink-0"
          :disabled="
            !newStatusHasText || newStatusDuplicate || createStatusMutation.isPending.value
          "
          @click="submitNewStatus"
        >
          <Loader2 v-if="createStatusMutation.isPending.value" class="size-4 animate-spin" />
          Add
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 shrink-0"
          :disabled="createStatusMutation.isPending.value"
          @click="cancelAddStatus"
        >
          Cancel
        </Button>
      </div>
      <p v-if="newStatusDuplicate" class="text-xs text-destructive">
        A status with this value already exists.
      </p>
      <p v-if="conflictStatus" class="text-xs text-destructive">
        "{{ conflictStatus }}" already exists.
      </p>
    </div>

    <div
      v-if="deleteStatusConflict"
      class="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
    >
      Cannot delete "{{ deleteStatusConflict }}" — it is in use by tasks. Move or reassign tasks
      from this status first.
    </div>

    <div v-if="statuses && statuses.length > 0" class="flex flex-col gap-1">
      <div
        v-for="s in statuses"
        :key="s.status"
        class="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/30"
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium">{{ friendlyStatusLabel(s.status) }}</span>
          <span class="font-mono text-xs text-muted-foreground">{{ s.status }}</span>
        </div>
        <Button
          v-if="canAdmin"
          variant="ghost"
          size="sm"
          class="h-7 shrink-0 hover:text-destructive"
          :disabled="deleteStatusMutation.isPending.value"
          :aria-label="`Delete status ${s.status}`"
          @click="startDeleteStatus(s.status)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <p v-else class="text-xs text-muted-foreground">No statuses configured.</p>

    <ConfirmDialog
      :open="!!deleteStatusTarget"
      title="Delete status?"
      confirm-label="Delete"
      :is-pending="deleteStatusMutation.isPending.value"
      @update:open="
        (v: boolean) => {
          if (!v) cancelDeleteStatus()
        }
      "
      @confirm="confirmDeleteStatus"
    >
      <template #description>
        This will remove <strong>{{ friendlyStatusLabel(deleteStatusTarget ?? '') }}</strong>
        <span class="font-mono text-xs">({{ deleteStatusTarget }})</span> from this project. Tasks
        using this status will not be affected until they are moved.
      </template>
    </ConfirmDialog>
  </div>
</template>
