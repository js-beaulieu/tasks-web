<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Loader2, Search, Trash2 } from '@lucide/vue'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import UserDisplay from '@/components/UserDisplay.vue'
import { useAddProjectMember } from '@/composables/useAddProjectMember'
import { useEffectiveRole } from '@/composables/useEffectiveRole'
import { useMembers } from '@/composables/useMembers'
import { useMe } from '@/composables/useMe'
import { useProject } from '@/composables/useProject'
import { useRemoveProjectMember } from '@/composables/useRemoveProjectMember'
import { useUpdateProjectMember } from '@/composables/useUpdateProjectMember'
import { useUserSearch } from '@/composables/useUserSearch'
import { useUsersByID } from '@/composables/useUsersByID'
import type { MemberRole, ProjectMember } from '@/api/members'

const props = defineProps<{
  projectID: string
}>()

const { data: project } = useProject(computed(() => props.projectID))
const { data: members, isLoading } = useMembers(computed(() => props.projectID))
const { data: me } = useMe()
const { isAdmin } = useEffectiveRole(
  computed(() => me.value?.id),
  project,
  members,
)

const memberUserIDs = computed(() => (members.value ?? []).map((member: ProjectMember) => member.userId))
const allUserIDs = computed(() => {
  const ids = [...memberUserIDs.value]
  if (project.value?.ownerId) ids.push(project.value.ownerId)
  return [...new Set(ids)]
})
const { data: usersByID } = useUsersByID(allUserIDs)

const searchQuery = ref('')
const addRole = ref<MemberRole>('read')
const editedRoles = ref<Record<string, MemberRole>>({})
const pendingRemoval = ref<ProjectMember | null>(null)
const pendingRoleChange = ref<{ member: ProjectMember; role: MemberRole } | null>(null)

const addMemberMutation = useAddProjectMember()
const updateMemberMutation = useUpdateProjectMember()
const removeMemberMutation = useRemoveProjectMember()

const { data: searchResults, isFetching: isSearching, isError: searchError } = useUserSearch(searchQuery)

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
const availableSearchResults = computed(() =>
  (searchResults.value ?? []).filter((user) => !memberIDs.value.has(user.id)),
)

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

function addCollaborator(userID: string): void {
  addMemberMutation.mutate(
    { projectID: props.projectID, input: { userId: userID, role: addRole.value } },
    {
      onSuccess: () => {
        searchQuery.value = ''
      },
    },
  )
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
    <Card v-if="isAdmin">
      <CardHeader>
        <CardTitle>Add collaborator</CardTitle>
        <CardDescription>Search by name or email, then choose the role to grant.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <div class="flex flex-col gap-2">
            <Label for="member-search">Search users</Label>
            <div class="relative">
              <Search class="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="member-search"
                v-model="searchQuery"
                class="pl-8"
                placeholder="Search by name or email"
              />
            </div>
            <p
              v-if="searchQuery.trim().length > 0 && searchQuery.trim().length < 2"
              class="text-xs text-muted-foreground"
            >
              Type at least 2 characters to search.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="member-role">Role</Label>
            <NativeSelect
              id="member-role"
              v-model="addRole"
              class="w-full"
              aria-label="Role for new collaborator"
            >
              <NativeSelectOption value="read">Read</NativeSelectOption>
              <NativeSelectOption value="modify">Modify</NativeSelectOption>
              <NativeSelectOption value="admin">Admin</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <div v-if="searchQuery.trim().length >= 2" class="flex flex-col gap-2">
          <div v-if="isSearching" class="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 class="h-4 w-4 animate-spin" />
            Searching users…
          </div>
          <p v-else-if="searchError" class="text-sm text-destructive">
            Could not search users right now.
          </p>
          <p v-else-if="availableSearchResults.length === 0" class="text-sm text-muted-foreground">
            No matching users available to add.
          </p>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="user in availableSearchResults"
              :key="user.id"
              class="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <UserDisplay :user="user" />
              <Button
                size="sm"
                :disabled="addMemberMutation.isPending.value"
                @click="addCollaborator(user.id)"
              >
                <Loader2 v-if="addMemberMutation.isPending.value" class="mr-1 h-4 w-4 animate-spin" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-12"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Loading members...</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="member in displayedMembers"
        :key="member.userId"
      >
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
              <Badge
                :variant="member.role === 'admin' ? 'default' : 'secondary'"
                class="text-xs"
              >
                {{ ROLE_LABELS[member.role] }}
              </Badge>
              <Badge v-if="member.userId === project?.ownerId" variant="outline" class="text-xs">Owner</Badge>
              <span
                v-if="member.userId === me?.id"
                class="text-xs text-muted-foreground"
              >
                (you)
              </span>
            </div>

            <div v-if="canManageMember(member)" class="flex flex-wrap items-center justify-end gap-2">
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

      <p
        v-if="displayedMembers.length === 0"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        No members found.
      </p>
    </div>

    <AlertDialog :open="!!pendingRoleChange" @update:open="(value) => { if (!value) closeRoleChangeDialog() }">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change collaborator role?</AlertDialogTitle>
          <AlertDialogDescription v-if="pendingRoleChange">
            Change <strong>{{ memberName(pendingRoleChange.member.userId) }}</strong> to
            <strong>{{ ROLE_LABELS[pendingRoleChange.role] }}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="closeRoleChangeDialog">Cancel</AlertDialogCancel>
          <Button :disabled="updateMemberMutation.isPending.value" @click="confirmRoleChange">
            <Loader2 v-if="updateMemberMutation.isPending.value" class="mr-1 h-4 w-4 animate-spin" />
            Confirm
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog :open="!!pendingRemoval" @update:open="(value) => { if (!value) pendingRemoval = null }">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove collaborator?</AlertDialogTitle>
          <AlertDialogDescription v-if="pendingRemoval">
            Remove <strong>{{ memberName(pendingRemoval.userId) }}</strong> from this project?
            Any tasks assigned to them will be reassigned to the project owner.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="pendingRemoval = null">Cancel</AlertDialogCancel>
          <Button variant="destructive" :disabled="removeMemberMutation.isPending.value" @click="confirmRemoval">
            <Loader2 v-if="removeMemberMutation.isPending.value" class="mr-1 h-4 w-4 animate-spin" />
            Remove
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
