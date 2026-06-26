import { startCase } from 'es-toolkit'
import { rrulestr } from 'rrule'

const FRIENDLY_STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

export function friendlyStatusLabel(status: string): string {
  return FRIENDLY_STATUS_LABELS[status] ?? startCase(status)
}

/**
 * Convert an RFC 5545 RRULE string into a short, human-readable label.
 *
 * Returns an empty string for null/empty input. Falls back to the raw string
 * when the rule cannot be parsed (the server remains the authoritative validator).
 *
 * Examples: "FREQ=DAILY" -> "Daily", "FREQ=WEEKLY;INTERVAL=2" -> "Every 2 weeks".
 */
export function formatRecurrence(recurrence: string | null | undefined): string {
  if (!recurrence || !recurrence.trim()) return ''
  try {
    const rule = rrulestr(recurrence)
    const text = rule.toText()
    return text.charAt(0).toUpperCase() + text.slice(1)
  } catch {
    return recurrence
  }
}
