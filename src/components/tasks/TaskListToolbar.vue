<script setup lang="ts">
import { LayoutGrid, List, ArrowUpDown, Filter } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskViewMode, TaskSortMode } from '@/stores/ui'

defineProps<{
  filteredCount: number
  hasActiveFilters: boolean
  selectedTags: string[]
  availableTags: string[]
  sortMode: TaskSortMode
  sortLabel: string
  view: TaskViewMode
}>()

const emit = defineEmits<{
  'update:selectedTags': [tags: string[]]
  'update:sortMode': [mode: TaskSortMode]
  'update:view': [view: TaskViewMode]
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="text-sm text-muted-foreground">
      {{ filteredCount }} task{{ filteredCount !== 1 ? 's' : '' }}
      <span v-if="hasActiveFilters" class="text-xs"> (filtered)</span>
    </div>
    <div class="flex items-center gap-1">
      <Popover>
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-2 text-xs gap-1"
            :class="hasActiveFilters ? 'border-primary' : ''"
          >
            <Filter class="h-3.5 w-3.5" />
            Filter
            <Badge
              v-if="hasActiveFilters"
              variant="secondary"
              class="ml-0.5 text-[10px] leading-none"
            >
              {{ selectedTags.length }}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" class="w-56">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Filter by tags</span>
              <Button
                v-if="hasActiveFilters"
                variant="ghost"
                size="sm"
                class="h-6 text-xs"
                @click="emit('update:selectedTags', [])"
              >
                Clear
              </Button>
            </div>
            <div
              v-if="availableTags.length === 0"
              class="py-2 text-center text-xs text-muted-foreground"
            >
              No tags available
            </div>
            <div v-else class="flex flex-col gap-1">
              <label
                v-for="tag in availableTags"
                :key="tag"
                class="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-accent"
              >
                <Checkbox
                  :model-value="selectedTags.includes(tag)"
                  @update:model-value="(v: boolean | 'indeterminate') => {
                    if (v === true) emit('update:selectedTags', [...selectedTags, tag])
                    else emit('update:selectedTags', selectedTags.filter((t) => t !== tag))
                  }"
                />
                {{ tag }}
              </label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 px-2 text-xs gap-1">
            <ArrowUpDown class="h-3.5 w-3.5" />
            {{ sortLabel }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            :class="sortMode === 'position' ? 'bg-accent' : ''"
            @click="emit('update:sortMode', 'position')"
          >
            Manual order
          </DropdownMenuItem>
          <DropdownMenuItem
            :class="sortMode === 'dueDate' ? 'bg-accent' : ''"
            @click="emit('update:sortMode', 'dueDate')"
          >
            Due date
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tabs
        :model-value="view"
        @update:model-value="(v) => { if (v) emit('update:view', v as TaskViewMode) }"
      >
        <TabsList>
          <TabsTrigger value="vertical" class="data-active:!bg-primary data-active:!text-primary-foreground">
            <List class="size-3.5" />
            List
          </TabsTrigger>
          <TabsTrigger value="board" class="data-active:!bg-primary data-active:!text-primary-foreground">
            <LayoutGrid class="size-3.5" />
            Board
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </div>
</template>