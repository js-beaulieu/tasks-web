<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2, Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

defineProps<{
  isPending?: boolean
  placeholder?: string
  toggleLabel?: string
}>()

const emit = defineEmits<{
  submit: [name: string]
}>()

const open = ref(false)
const name = ref('')
const hasText = computed(() => name.value.trim().length > 0)

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
  name.value = ''
}

function onInput(e: Event) {
  name.value = (e.target as HTMLInputElement).value
}
</script>

<template>
  <div v-if="open" class="flex items-center gap-1">
    <Input
      :model-value="name"
      :placeholder="placeholder ?? 'Task name…'"
      class="h-8 text-sm"
      @input="onInput"
      @keydown="
        (e: KeyboardEvent) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') open = false
        }
      "
    />
    <Button class="h-8 shrink-0" :disabled="!hasText || isPending" @click="submit">
      <Loader2 v-if="isPending" class="size-4 animate-spin" />
      Add
    </Button>
  </div>
  <Button
    v-else
    variant="ghost"
    size="sm"
    class="h-7 text-xs text-muted-foreground"
    @click="open = true"
  >
    <Plus class="mr-1 h-3 w-3" />
    {{ toggleLabel ?? 'Add task' }}
  </Button>
</template>
