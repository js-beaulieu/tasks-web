import { describe, it, expect } from 'vitest'
import { friendlyStatusLabel } from './tasks'

describe('friendlyStatusLabel', () => {
  it('returns known labels for default statuses', () => {
    expect(friendlyStatusLabel('todo')).toBe('To Do')
    expect(friendlyStatusLabel('in_progress')).toBe('In Progress')
    expect(friendlyStatusLabel('done')).toBe('Done')
    expect(friendlyStatusLabel('cancelled')).toBe('Cancelled')
  })

  it('converts snake_case unknown statuses to Start Case', () => {
    expect(friendlyStatusLabel('in_review')).toBe('In Review')
    expect(friendlyStatusLabel('blocked')).toBe('Blocked')
  })
})