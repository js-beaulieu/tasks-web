import { describe, it, expect } from 'vitest'
import { friendlyStatusLabel, formatRecurrence } from './tasks'

describe('friendlyStatusLabel', () => {
  it('maps known statuses', () => {
    expect(friendlyStatusLabel('todo')).toBe('To Do')
    expect(friendlyStatusLabel('in_progress')).toBe('In Progress')
    expect(friendlyStatusLabel('done')).toBe('Done')
    expect(friendlyStatusLabel('cancelled')).toBe('Cancelled')
  })

  it('startCases unknown statuses', () => {
    expect(friendlyStatusLabel('in_review')).toBe('In Review')
  })
})

describe('formatRecurrence', () => {
  it('returns empty string for null or empty input', () => {
    expect(formatRecurrence(null)).toBe('')
    expect(formatRecurrence('')).toBe('')
    expect(formatRecurrence('   ')).toBe('')
    expect(formatRecurrence(undefined)).toBe('')
  })

  it('formats daily recurrence', () => {
    expect(formatRecurrence('FREQ=DAILY')).toBe('Every day')
  })

  it('formats weekly recurrence', () => {
    expect(formatRecurrence('FREQ=WEEKLY')).toBe('Every week')
  })

  it('formats monthly recurrence', () => {
    expect(formatRecurrence('FREQ=MONTHLY')).toBe('Every month')
  })

  it('formats yearly recurrence', () => {
    expect(formatRecurrence('FREQ=YEARLY')).toBe('Every year')
  })

  it('formats interval recurrence', () => {
    expect(formatRecurrence('FREQ=WEEKLY;INTERVAL=2')).toBe('Every 2 weeks')
    expect(formatRecurrence('FREQ=MONTHLY;INTERVAL=3')).toBe('Every 3 months')
  })

  it('returns raw string for unparseable input', () => {
    expect(formatRecurrence('BOGUS')).toBe('BOGUS')
    expect(formatRecurrence('not-an-rrule')).toBe('not-an-rrule')
  })

  it('accepts RRULE: prefix', () => {
    expect(formatRecurrence('RRULE:FREQ=DAILY')).toBe('Every day')
  })

  it('handles complex rules via toText fallback', () => {
    const label = formatRecurrence('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
    expect(label.length).toBeGreaterThan(0)
    expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase())
  })
})