import { format, formatDistanceToNow, isBefore, parseISO, startOfDay } from 'date-fns'

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