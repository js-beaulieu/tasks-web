import { format, formatDistanceToNow, isBefore, parseISO, startOfDay } from 'date-fns'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy')
}

export function formatDateTime(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy h:mm a')
}

export function formatRelativeDate(isoDate: string): string {
  return formatDistanceToNow(parseISO(isoDate), { addSuffix: true })
}

export function isOverdue(isoDate: string): boolean {
  return isBefore(parseISO(isoDate), startOfDay(new Date()))
}

export function parseISOToDateValue(iso: string | null): DateValue | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function dateValueToISO(dv: DateValue | undefined): string | undefined {
  if (!dv) return undefined
  return new Date(dv.year, dv.month - 1, dv.day).toISOString()
}
