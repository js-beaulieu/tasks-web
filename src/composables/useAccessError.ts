import { computed, toValue } from 'vue'
import type { MaybeRef } from 'vue'
import { ApiError } from '@/api/client'

interface AccessError {
  title: string
  message: string
}

export function useAccessError(
  isError: MaybeRef<boolean>,
  error: MaybeRef<unknown>,
  noun: string = 'this',
) {
  return computed<AccessError | null>(() => {
    const err = toValue(error)
    if (!toValue(isError) || !err) return null

    const status = err instanceof ApiError ? err.problem.status : undefined

    if (status === 404) {
      return {
        title: 'Not found',
        message: `This ${noun} does not exist or you no longer have access to it.`,
      }
    }
    if (status === 403) {
      return {
        title: 'Access denied',
        message: `You do not have permission to view this ${noun}.`,
      }
    }
    if (status === 401) {
      return {
        title: 'Session expired',
        message: 'Your session has expired. Sign in again to continue.',
      }
    }

    return {
      title: `Could not load ${noun}`,
      message: err instanceof Error ? err.message : `Something went wrong while loading this ${noun}.`,
    }
  })
}