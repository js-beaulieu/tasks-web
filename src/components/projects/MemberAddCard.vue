<script setup lang="ts">
import { computed, ref } from 'vue'
import { Loader2, Search } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import UserDisplay from '@/components/UserDisplay.vue'
import { useAddProjectMember } from '@/composables/members/useAddProjectMember'
import { useUserSearch } from '@/composables/members/useUserSearch'
import { useDebouncedValue } from '@/composables/_ui/useDebouncedValue'
import type { MemberRole } from '@/api/members'
import type { User } from '@/api/users'

const props = defineProps<{
  projectID: string
  existingMemberIds: Set<string>
}>()

const emit = defineEmits<{
  added: []
}>()

const searchQuery = ref('')
const addRole = ref<MemberRole>('read')

const addMemberMutation = useAddProjectMember()

const searchQueryTrimmed = computed(() => searchQuery.value.trim())
const { debounced: debouncedSearchQuery, isDebouncing: isDebouncingSearch } = useDebouncedValue(
  searchQueryTrimmed,
  300,
  (query) => query.length >= 2,
)
const { data: searchResults, isFetching: isSearching, isError: searchError } = useUserSearch(debouncedSearchQuery)

const availableSearchResults = computed(() =>
  (searchResults.value ?? []).filter((user: User) => !props.existingMemberIds.has(user.id)),
)

const isSearchBusy = computed(() => isDebouncingSearch.value || isSearching.value)

function addCollaborator(userID: string): void {
  addMemberMutation.mutate(
    { projectID: props.projectID, input: { userId: userID, role: addRole.value } },
    {
      onSuccess: () => {
        searchQuery.value = ''
        emit('added')
      },
    },
  )
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Add collaborator</CardTitle>
      <CardDescription>Search by name or email, then choose the role to grant.</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <div class="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div class="flex flex-col gap-2">
          <Label for="member-search">Search users</Label>
          <div class="relative">
            <Search v-if="!isSearchBusy" class="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Loader2 v-else class="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 animate-spin text-primary" />
            <Input
              id="member-search"
              v-model="searchQuery"
              class="pl-8"
              placeholder="Search by name or email"
            />
          </div>
          <p
            v-if="searchQueryTrimmed.length > 0 && searchQueryTrimmed.length < 2"
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

      <div v-if="searchQueryTrimmed.length >= 2" class="flex flex-col gap-2">
        <div v-if="isSearchBusy" class="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <Loader2 class="h-4 w-4 animate-spin text-primary" />
            <span>Searching users...</span>
          </div>
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
</template>