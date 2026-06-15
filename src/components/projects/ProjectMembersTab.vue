<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import UserDisplay from '@/components/UserDisplay.vue'
import { useMembers } from '@/composables/useMembers'
import { useUsersByID } from '@/composables/useUsersByID'
import { useMe } from '@/composables/useMe'
import { useProject } from '@/composables/useProject'
import type { ProjectMember } from '@/api/members'

const props = defineProps<{
  projectID: string
}>()

const { data: project } = useProject(computed(() => props.projectID))
const { data: members, isLoading } = useMembers(computed(() => props.projectID))
const { data: me } = useMe()

const memberUserIDs = computed(() => (members.value ?? []).map((m: ProjectMember) => m.userId))
const ownerIDs = computed(() => (project.value ? [project.value.ownerId] : []))
const allUserIDs = computed(() => {
  const ids = [...ownerIDs.value, ...memberUserIDs.value]
  return [...new Set(ids)]
})
const { data: usersByID } = useUsersByID(allUserIDs)

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  modify: 'Modify',
  read: 'Read',
}

const combinedMembers = computed(() => {
  if (!project.value || !members.value) return []

  const ownerID = project.value.ownerId
  const explicitMembers = members.value.filter((m: ProjectMember) => m.userId !== ownerID)
  const ownerEntry: ProjectMember = {
    projectId: props.projectID,
    userId: ownerID,
    role: 'admin' as const,
  }

  return [ownerEntry, ...explicitMembers]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="isLoading"
      class="flex flex-col items-center gap-3 py-12"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-sm text-muted-foreground">Loading members…</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="member in combinedMembers"
        :key="member.userId"
      >
        <div class="flex items-center justify-between py-2">
          <UserDisplay
            v-if="usersByID?.[member.userId]"
            :user="usersByID[member.userId]!"
          />
          <div class="flex items-center gap-2">
            <Badge
              :variant="member.role === 'admin' ? 'default' : 'secondary'"
              class="text-xs"
            >
              {{ ROLE_LABELS[member.role] ?? member.role }}
            </Badge>
            <span
              v-if="member.userId === me?.id"
              class="text-xs text-muted-foreground"
            >
              (you)
            </span>
          </div>
        </div>
        <Separator />
      </div>

      <p
        v-if="combinedMembers.length === 0"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        No members found.
      </p>
    </div>
  </div>
</template>