import { describe, it, expect, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { showErrorToast } from './error'

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn<(title: string, options?: object) => void>(),
  },
}))

const { toast } = await import('vue-sonner')

describe('showErrorToast', () => {
  it('shows ApiError detail as description', () => {
    showErrorToast('Failed', new ApiError({ type: '', title: 'Bad Request', status: 400, detail: 'Name is required' }))

    expect(toast.error).toHaveBeenCalledWith('Failed', { description: 'Name is required' })
  })

  it('falls back to ApiError title when detail is missing', () => {
    showErrorToast('Failed', new ApiError({ type: '', title: 'Unauthorized', status: 401 }))

    expect(toast.error).toHaveBeenCalledWith('Failed', { description: 'Unauthorized' })
  })

  it('shows Error message as description', () => {
    showErrorToast('Failed', new Error('Network failure'))

    expect(toast.error).toHaveBeenCalledWith('Failed', { description: 'Network failure' })
  })

  it('shows generic message for unknown errors', () => {
    showErrorToast('Failed', 'oops')

    expect(toast.error).toHaveBeenCalledWith('Failed', { description: 'Something went wrong.' })
  })
})
