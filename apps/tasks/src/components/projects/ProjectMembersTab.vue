<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import UserDisplay from '@/components/UserDisplay.vue'
import MemberAddCard from '@/components/projects/MemberAddCard.vue'
import { useProjectPermissions } from '@/composables/projects/useProjectPermissions'
import { useMembers } from '@/composables/members/useMembers'
import { useMe } from '@/composables/users/useMe'
import { useProject } from '@/composables/projects/useProject'
import { useRemoveProjectMember } from '@/composables/members/useRemoveProjectMember'
import { useUpdateProjectMember } from '@/composables/members/useUpdateProjectMember'
import { useUsersByID } from '@/composables/users/useUsersByID'
import type { MemberRole, ProjectMember } from '@/api/members'

const props = defineProps<{
  projectID: string
}>()

const { data: project } = useProject(computed(() => props.projectID))
const { data: members, isLoading } = useMembers(computed(() => props.projectID))
const { data: me } = useMe()
const { canAdmin: isAdmin } = useProjectPermissions(project)

const memberUserIDs = computed(() =>
  (members.value ?? []).map((member: ProjectMember) => member.userId),
)
const allUserIDs = computed(() => {
  const ids = [...memberUserIDs.value]
  if (project.value?.ownerId) ids.push(project.value.ownerId)
  return [...new Set(ids)]
})
const { data: usersByID } = useUsersByID(allUserIDs)

const editedRoles = ref<Record<string, MemberRole>>({})
const pendingRemoval = ref<ProjectMember | null>(null)
const pendingRoleChange = ref<{ member: ProjectMember; role: MemberRole } | null>(null)

const updateMemberMutation = useUpdateProjectMember()
const removeMemberMutation = useRemoveProjectMember()

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: 'Admin',
  modify: 'Modify',
  read: 'Read',
}

const ROLE_ORDER: Record<MemberRole, number> = {
  admin: 0,
  modify: 1,
  read: 2,
}

const displayedMembers = computed(() => {
  const currentMembers = members.value ?? []
  return [...currentMembers].sort((left, right) => {
    const leftIsOwner = left.userId === project.value?.ownerId
    const rightIsOwner = right.userId === project.value?.ownerId
    if (leftIsOwner !== rightIsOwner) return leftIsOwner ? -1 : 1

    const roleDelta = ROLE_ORDER[left.role] - ROLE_ORDER[right.role]
    if (roleDelta !== 0) return roleDelta

    const leftName = usersByID.value?.[left.userId]?.name ?? left.userId
    const rightName = usersByID.value?.[right.userId]?.name ?? right.userId
    return leftName.localeCompare(rightName)
  })
})

const memberIDs = computed(() => new Set(displayedMembers.value.map((member) => member.userId)))

watch(
  displayedMembers,
  (nextMembers) => {
    const nextRoles: Record<string, MemberRole> = {}
    for (const member of nextMembers) {
      nextRoles[member.userId] = editedRoles.value[member.userId] ?? member.role
    }
    editedRoles.value = nextRoles
  },
  { immediate: true },
)

function memberName(userID: string): string {
  return usersByID.value?.[userID]?.name ?? 'Unknown user'
}

function canManageMember(member: ProjectMember): boolean {
  return isAdmin.value && member.userId !== project.value?.ownerId
}

function resetEditedRole(member: ProjectMember): void {
  editedRoles.value[member.userId] = member.role
}

function requestRoleChange(member: ProjectMember): void {
  const nextRole = editedRoles.value[member.userId]
  if (!nextRole || nextRole === member.role) return
  pendingRoleChange.value = { member, role: nextRole }
}

function closeRoleChangeDialog(): void {
  if (pendingRoleChange.value) {
    resetEditedRole(pendingRoleChange.value.member)
  }
  pendingRoleChange.value = null
}

function confirmRoleChange(): void {
  if (!pendingRoleChange.value) return
  const { member, role } = pendingRoleChange.value
  updateMemberMutation.mutate(
    { projectID: props.projectID, userID: member.userId, role },
    {
      onSuccess: () => {
        pendingRoleChange.value = null
      },
    },
  )
}

function confirmRemoval(): void {
  if (!pendingRemoval.value) return
  removeMemberMutation.mutate(
    { projectID: props.projectID, userID: pendingRemoval.value.userId },
    {
      onSuccess: () => {
        pendingRemoval.value = null
      },
    },
  )
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <MemberAddCard v-if="isAdmin" :project-i-d="projectID" :existing-member-ids="memberIDs" />

    <LoadingState v-if="isLoading" message="Loading members…" />

    <div v-else class="flex flex-col gap-3">
      <div v-for="member in displayedMembers" :key="member.userId">
        <div class="flex items-start justify-between gap-3 py-2">
          <div class="min-w-0 flex-1">
            <UserDisplay v-if="usersByID?.[member.userId]" :user="usersByID[member.userId]!" />
            <div v-else class="flex min-w-0 flex-col">
              <span class="text-sm font-medium">Unknown user</span>
              <span class="text-xs text-muted-foreground">{{ member.userId }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <div class="flex flex-wrap items-center justify-end gap-2">
              <Badge :variant="member.role === 'admin' ? 'default' : 'secondary'" class="text-xs">
                {{ ROLE_LABELS[member.role] }}
              </Badge>
              <Badge v-if="member.userId === project?.ownerId" variant="outline" class="text-xs"
                >Owner</Badge
              >
              <span v-if="member.userId === me?.id" class="text-xs text-muted-foreground">
                (you)
              </span>
            </div>

            <div
              v-if="canManageMember(member)"
              class="flex flex-wrap items-center justify-end gap-2"
            >
              <NativeSelect
                v-model="editedRoles[member.userId]"
                size="sm"
                :aria-label="`Role for ${memberName(member.userId)}`"
              >
                <NativeSelectOption value="read">Read</NativeSelectOption>
                <NativeSelectOption value="modify">Modify</NativeSelectOption>
                <NativeSelectOption value="admin">Admin</NativeSelectOption>
              </NativeSelect>

              <Button
                v-if="editedRoles[member.userId] !== member.role"
                size="sm"
                variant="outline"
                :disabled="updateMemberMutation.isPending.value"
                @click="requestRoleChange(member)"
              >
                Save role
              </Button>

              <Button
                size="icon"
                variant="outline"
                class="h-8 w-8"
                :aria-label="`Remove ${memberName(member.userId)}`"
                :disabled="removeMemberMutation.isPending.value"
                @click="pendingRemoval = member"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      <EmptyState v-if="displayedMembers.length === 0" message="No members found." />
    </div>

    <ConfirmDialog
      :open="!!pendingRoleChange"
      title="Change collaborator role?"
      confirm-label="Confirm"
      :is-pending="updateMemberMutation.isPending.value"
      @update:open="
        (value: boolean) => {
          if (!value) closeRoleChangeDialog()
        }
      "
      @confirm="confirmRoleChange"
    >
      <template #description v-if="pendingRoleChange">
        Change <strong>{{ memberName(pendingRoleChange.member.userId) }}</strong> to
        <strong>{{ ROLE_LABELS[pendingRoleChange.role] }}</strong
        >?
      </template>
    </ConfirmDialog>

    <ConfirmDialog
      :open="!!pendingRemoval"
      title="Remove collaborator?"
      confirm-label="Remove"
      :is-pending="removeMemberMutation.isPending.value"
      @update:open="
        (value: boolean) => {
          if (!value) pendingRemoval = null
        }
      "
      @confirm="confirmRemoval"
    >
      <template #description v-if="pendingRemoval">
        Remove <strong>{{ memberName(pendingRemoval.userId) }}</strong> from this project? Any tasks
        assigned to them will be reassigned to the project owner.
      </template>
    </ConfirmDialog>
  </div>
</template>
