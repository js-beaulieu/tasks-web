import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeDate, isOverdue } from './date'

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    expect(formatDate('2026-06-14T12:00:00Z')).toContain('Jun 14, 2026')
  })
})

describe('formatRelativeDate', () => {
  it('returns relative time from now', () => {
    const result = formatRelativeDate(new Date(Date.now() - 3600 * 1000).toISOString())
    expect(result).toMatch(/about \d+ hour(s)? ago/)
  })
})

describe('isOverdue', () => {
  it('returns true for past date', () => {
    expect(isOverdue('2000-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for future date', () => {
    expect(isOverdue('2099-01-01T00:00:00Z')).toBe(false)
  })
})
