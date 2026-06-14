<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useColorMode } from '@/composables/useColorMode'

const { mode, toggle } = useColorMode()
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Toggle theme" @click="toggle">
    <Sun v-if="mode === 'light'" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </Button>
</template>
