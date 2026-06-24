<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { friendlyStatusLabel } from '@/lib/tasks'
import type { ProjectStatus } from '@/api/statuses'

const props = defineProps<{
  statuses: ProjectStatus[]
  modelValue: string
  placeholder?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const options = computed(() =>
  props.statuses.map((s) => ({ value: s.status, label: friendlyStatusLabel(s.status) })),
)
</script>

<template>
  <Select
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event as string)"
  >
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder ?? 'Select status'" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>