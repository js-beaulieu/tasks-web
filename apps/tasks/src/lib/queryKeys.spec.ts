import { describe, it, expect } from 'vitest'
import { qk } from './queryKeys'

describe('queryKeys (qk)', () => {
  it('me returns ["me"]', () => {
    expect(qk.me()).toEqual(['me'])
  })

  it('tags returns ["tags"]', () => {
    expect(qk.tags()).toEqual(['tags'])
  })

  it('projects returns ["projects"]', () => {
    expect(qk.projects()).toEqual(['projects'])
  })

  it('project returns ["projects", id]', () => {
    expect(qk.project('p1')).toEqual(['projects', 'p1'])
  })

  it('projectTasks returns ["projects", id, "tasks", filters]', () => {
    expect(qk.projectTasks('p1')).toEqual(['projects', 'p1', 'tasks', undefined])
    expect(qk.projectTasks('p1', { status: 'todo' })).toEqual([
      'projects',
      'p1',
      'tasks',
      { status: 'todo' },
    ])
  })

  it('projectStatuses returns ["projects", id, "statuses"]', () => {
    expect(qk.projectStatuses('p1')).toEqual(['projects', 'p1', 'statuses'])
  })

  it('projectMembers returns ["projects", id, "members"]', () => {
    expect(qk.projectMembers('p1')).toEqual(['projects', 'p1', 'members'])
  })

  it('task returns ["tasks", id]', () => {
    expect(qk.task('t1')).toEqual(['tasks', 't1'])
  })

  it('task accepts undefined id', () => {
    expect(qk.task(undefined)).toEqual(['tasks', undefined])
  })

  it('taskTags returns ["tasks", id, "tags"]', () => {
    expect(qk.taskTags('t1')).toEqual(['tasks', 't1', 'tags'])
  })

  it('taskSubtasks returns ["tasks", id, "subtasks"]', () => {
    expect(qk.taskSubtasks('t1')).toEqual(['tasks', 't1', 'subtasks'])
  })

  it('tasks returns ["tasks"]', () => {
    expect(qk.tasks()).toEqual(['tasks'])
  })

  it('usersByID returns ["users", "by-id", ids]', () => {
    expect(qk.usersByID(['u1', 'u2'])).toEqual(['users', 'by-id', ['u1', 'u2']])
  })

  it('userSearch returns ["users", "search", query, limit]', () => {
    expect(qk.userSearch('alex', 20)).toEqual(['users', 'search', 'alex', 20])
  })
})
