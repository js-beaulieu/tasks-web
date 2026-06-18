<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Tag as TagIcon, Loader2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskTags } from '@/composables/tags/useTaskTags'
import { useAddTaskTag } from '@/composables/tags/useAddTaskTag'
import { useRemoveTaskTag } from '@/composables/tags/useRemoveTaskTag'
import { useTags } from '@/composables/useTags'

const props = defineProps<{
  taskID: string
  canModify: boolean
}>()

const { data: tags } = useTaskTags(computed(() => props.taskID))
const { data: allTags } = useTags()

const addMutation = useAddTaskTag()
const removeMutation = useRemoveTaskTag()

const newTag = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const suggestions = computed(() => {
  const current = new Set((tags.value ?? []).map((t) => t.toLowerCase()))
  return (allTags.value ?? []).filter((t) => !current.has(t.toLowerCase()))
})

function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, '-')
}

function submitTag() {
  const normalized = normalizeTag(newTag.value)
  if (!normalized) return
  const existing = (tags.value ?? []).map((t) => t.toLowerCase())
  if (existing.includes(normalized.toLowerCase())) {
    newTag.value = ''
    return
  }
  addMutation.mutate(
    { taskID: props.taskID, tag: normalized },
    { onSuccess: () => { newTag.value = ''; inputEl.value?.focus() } },
  )
}

function removeTag(tag: string) {
  removeMutation.mutate({ taskID: props.taskID, tag })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    submitTag()
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1.5 text-sm font-medium">
      <TagIcon class="size-3.5 text-muted-foreground" />
      Tags
    </div>

    <div v-if="(tags?.length ?? 0) > 0" class="flex flex-wrap gap-1.5">
      <Badge
        v-for="tag in tags"
        :key="tag"
        variant="secondary"
        class="gap-1 text-xs"
      >
        {{ tag }}
        <button
          v-if="canModify"
          type="button"
          class="ml-0.5 rounded-sm hover:bg-destructive/20"
          :aria-label="`Remove tag ${tag}`"
          :data-testid="`remove-tag-${tag}`"
          @click="removeTag(tag)"
        >
          <X class="size-3" />
        </button>
      </Badge>
    </div>

    <p
      v-else
      class="text-xs text-muted-foreground"
    >
      No tags yet.
    </p>

    <div v-if="canModify" class="flex items-center gap-1">
      <Input
        ref="inputEl"
        v-model="newTag"
        list="tag-suggestions"
        placeholder="Add tag…"
        class="h-8 text-sm"
        :data-testid="'tag-input'"
        @keydown="onKeydown"
      />
      <datalist id="tag-suggestions">
        <option v-for="s in suggestions" :key="s" :value="s" />
      </datalist>
      <Button
        size="sm"
        class="h-8 shrink-0"
        :disabled="!newTag.trim() || addMutation.isPending.value"
        :data-testid="'add-tag-btn'"
        @click="submitTag"
      >
        <Loader2 v-if="addMutation.isPending.value" class="size-4 animate-spin" />
        Add
      </Button>
    </div>
  </div>
</template>
