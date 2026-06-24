import { describe, it, expect } from 'vitest'
import { parseISOToDateValue, dateValueToISO } from './date'

describe('parseISOToDateValue', () => {
  it('returns undefined for null', () => {
    expect(parseISOToDateValue(null)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(parseISOToDateValue('')).toBeUndefined()
  })

  it('parses an ISO date into a CalendarDate', () => {
    const dv = parseISOToDateValue('2026-06-15T12:00:00Z')
    expect(dv).toBeDefined()
    expect(dv!.year).toBe(2026)
    expect(dv!.month).toBe(6)
    expect(dv!.day).toBe(15)
  })
})

describe('dateValueToISO', () => {
  it('returns undefined for undefined input', () => {
    expect(dateValueToISO(undefined)).toBeUndefined()
  })

  it('converts a DateValue back to an ISO string', () => {
    const dv = parseISOToDateValue('2026-06-15T12:00:00Z')!
    const iso = dateValueToISO(dv)
    expect(iso).toBeDefined()
    expect(new Date(iso!).getUTCFullYear()).toBe(2026)
    expect(new Date(iso!).getUTCMonth()).toBe(5)
    expect(new Date(iso!).getUTCDate()).toBe(15)
  })

  it('round-trips through parseISOToDateValue', () => {
    const original = '2026-03-08T08:30:00Z'
    const dv = parseISOToDateValue(original)!
    const iso = dateValueToISO(dv)!
    const d = new Date(iso)
    expect(d.getUTCFullYear()).toBe(2026)
    expect(d.getUTCMonth()).toBe(2)
    expect(d.getUTCDate()).toBe(8)
  })
})