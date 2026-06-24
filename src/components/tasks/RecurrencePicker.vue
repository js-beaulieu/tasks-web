<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RotateCw, X } from '@lucide/vue'
import { RRule, rrulestr, type Frequency } from 'rrule'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatRecurrence } from '@/lib/tasks'

const props = defineProps<{
  modelValue: string | null
  dueDate: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

type FreqOption = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'

const PRESET_OPTIONS: { value: FreqOption; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom' },
]

const FREQ_TO_RRULE: Record<Exclude<FreqOption, 'CUSTOM'>, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
}

const RRULE_TO_FREQ: Record<number, Exclude<FreqOption, 'CUSTOM'>> = {
  [RRule.DAILY]: 'DAILY',
  [RRule.WEEKLY]: 'WEEKLY',
  [RRule.MONTHLY]: 'MONTHLY',
  [RRule.YEARLY]: 'YEARLY',
}

const selectedFreq = ref<FreqOption>('WEEKLY')
const interval = ref(1)
const customText = ref('')

function isPreset(rruleStr: string): { freq: Exclude<FreqOption, 'CUSTOM'>; intervalVal: number } | null {
  try {
    const rule = rrulestr(rruleStr)
    const freq = RRULE_TO_FREQ[rule.options.freq]
    if (!freq) return null
    const opts = rule.options
    const hasExtras = Boolean(
      opts.byweekday?.length ||
        opts.bymonthday?.length ||
        opts.byyearday?.length ||
        opts.byweekno?.length ||
        opts.bymonth?.length ||
        opts.byeaster !== undefined && opts.byeaster !== null ||
        opts.wkst !== undefined && opts.wkst !== null ||
        opts.count ||
        opts.until,
    )
    if (hasExtras) return null
    return { freq, intervalVal: opts.interval || 1 }
  } catch {
    return null
  }
}

function syncFromModel(value: string | null) {
  if (!value || !value.trim()) {
    selectedFreq.value = 'WEEKLY'
    interval.value = 1
    customText.value = ''
    return
  }
  const preset = isPreset(value)
  if (preset) {
    selectedFreq.value = preset.freq
    interval.value = preset.intervalVal
    customText.value = ''
  } else {
    selectedFreq.value = 'CUSTOM'
    customText.value = value
    interval.value = 1
  }
}

watch(() => props.modelValue, syncFromModel, { immediate: true })

function emitValue() {
  if (selectedFreq.value === 'CUSTOM') {
    const trimmed = customText.value.trim()
    emit('update:modelValue', trimmed || null)
    return
  }
  if (interval.value === 1) {
    emit('update:modelValue', `FREQ=${selectedFreq.value}`)
    return
  }
  const freq = FREQ_TO_RRULE[selectedFreq.value]
  const rule = new RRule({
    freq,
    interval: interval.value,
  })
  const str = rule.toString().replace(/^RRULE:/, '')
  emit('update:modelValue', str)
}

function onFreqChange(value: string) {
  selectedFreq.value = value as FreqOption
  if (value === 'CUSTOM' && !customText.value && props.modelValue) {
    customText.value = props.modelValue
  }
  emitValue()
}

function onIntervalChange() {
  if (selectedFreq.value === 'CUSTOM') return
  emitValue()
}

function onCustomChange() {
  if (selectedFreq.value !== 'CUSTOM') return
  emitValue()
}

function onIntervalInput(v: string | number) {
  interval.value = Math.max(1, parseInt(String(v), 10) || 1)
  onIntervalChange()
}

function onCustomInput(v: string | number) {
  customText.value = String(v)
  onCustomChange()
}

function clearRecurrence() {
  selectedFreq.value = 'WEEKLY'
  interval.value = 1
  customText.value = ''
  emit('update:modelValue', null)
}

const summary = computed(() => formatRecurrence(props.modelValue))

const needsDueDate = computed(() => {
  const value = selectedFreq.value === 'CUSTOM' ? customText.value.trim() : 'set'
  return Boolean(value) && !props.dueDate
})

const hasRecurrence = computed(() => Boolean(props.modelValue && props.modelValue.trim()))
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label>Recurrence</Label>

    <div class="flex items-start gap-2">
      <RotateCw class="mt-2 size-4 shrink-0 text-muted-foreground" />
      <div class="flex-1 flex flex-col gap-2">
        <Select
          :model-value="selectedFreq"
          @update:model-value="(v) => onFreqChange(String(v))"
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in PRESET_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div v-if="selectedFreq !== 'CUSTOM'" class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground whitespace-nowrap">Repeat every</span>
          <Input
            :model-value="String(interval)"
            type="number"
            min="1"
            max="999"
            class="h-8 w-20 text-sm"
            data-testid="recurrence-interval"
            @update:model-value="onIntervalInput"
          />
          <span class="text-xs text-muted-foreground">
            {{ interval === 1
              ? selectedFreq.toLowerCase().replace(/ly$/, '')
              : selectedFreq.toLowerCase().replace(/ly$/, '') + 's'
            }}
          </span>
        </div>

        <Input
          v-else
          :model-value="customText"
          placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
          class="text-sm"
          data-testid="recurrence-custom"
          @update:model-value="onCustomInput"
        />
      </div>

      <Button
        v-if="hasRecurrence"
        variant="ghost"
        size="icon"
        class="mt-0.5 shrink-0"
        aria-label="Clear recurrence"
        data-testid="recurrence-clear"
        @click="clearRecurrence"
      >
        <X class="size-4" />
      </Button>
    </div>

    <p v-if="summary" class="text-xs text-muted-foreground">
      {{ summary }}
    </p>

    <p
      v-if="needsDueDate"
      class="text-xs text-amber-600 dark:text-amber-500"
    >
      Recurring tasks require a due date.
    </p>
  </div>
</template>