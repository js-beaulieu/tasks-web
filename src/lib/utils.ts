import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS class names.
 *
 * Combines `clsx` (conditional/object class lists) with `tailwind-merge`
 * (resolves conflicting utilities such as `px-2 px-4`). This is the standard
 * helper used by shadcn-vue components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
