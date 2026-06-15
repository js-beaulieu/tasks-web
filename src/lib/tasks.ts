import { startCase } from 'es-toolkit'

const FRIENDLY_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

export function friendlyStatusLabel(status: string): string {
  return FRIENDLY_STATUS_LABELS[status] ?? startCase(status)
}