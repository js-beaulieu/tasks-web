import { toast } from 'vue-sonner'
import { ApiError, TimeoutError } from '@/api/client'

export function showErrorToast(title: string, error: unknown): void {
  let message: string
  if (error instanceof TimeoutError) {
    message = 'Request timed out. Please try again.'
  } else if (error instanceof ApiError) {
    message = error.problem.detail ?? error.problem.title
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = 'Something went wrong.'
  }

  toast.error(title, { description: message })
}
