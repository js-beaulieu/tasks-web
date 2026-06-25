import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient, UseMutationOptions } from '@tanstack/vue-query'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn<(args: { queryKey: unknown[] }) => void>(),
  removeQueries: vi.fn<(args: { queryKey: unknown[] }) => void>(),
  useMutationMock: vi.fn<(opts: UseMutationOptions<unknown, Error, unknown>) => unknown>(),
  showErrorToast: vi.fn<(message: string, error: Error) => void>(),
}))

interface CapturedMutationOptions<TData, TVariables> {
  mutationFn?: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables, _ctx1?: unknown, _ctx2?: unknown) => void
  onError?: (error: Error, _variables?: TVariables, _ctx1?: unknown, _ctx2?: unknown) => void
}

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
    removeQueries: mocks.removeQueries,
  }),
  useMutation: mocks.useMutationMock,
}))

vi.mock('@/lib/error', () => ({
  showErrorToast: mocks.showErrorToast,
}))

import { createResourceMutation } from './createResourceMutation'

describe('createResourceMutation', () => {
  beforeEach(() => {
    mocks.invalidateQueries.mockReset()
    mocks.removeQueries.mockReset()
    mocks.useMutationMock.mockReset()
    mocks.showErrorToast.mockReset()
    mocks.useMutationMock.mockImplementation((opts: UseMutationOptions<unknown, Error, unknown>) => opts)
  })

  it('passes mutationFn through to useMutation', async () => {
    const mutationFn = vi.fn<(v: { id: string }) => Promise<{ ok: string }>>(async (v) => ({ ok: v.id }))
    createResourceMutation({ mutationFn, errorMessage: 'boom' })
    const opts = mocks.useMutationMock.mock.calls[0]![0] as unknown as CapturedMutationOptions<{ ok: string }, { id: string }>
    const data = await opts.mutationFn!({ id: 'x' })

    expect(mutationFn).toHaveBeenCalledWith({ id: 'x' })
    expect(data).toEqual({ ok: 'x' })
  })

  it('invalidates and removes query keys on success', () => {
    createResourceMutation({
      mutationFn: async () => ({ id: 'x' }),
      errorMessage: 'boom',
      invalidate: () => [['projects'], ['tasks', 'x']],
      remove: () => [['projects', 'x']],
    })
    const opts = mocks.useMutationMock.mock.calls[0]![0] as unknown as CapturedMutationOptions<{ id: string }, unknown>

    opts.onSuccess?.({ id: 'x' }, undefined, undefined, undefined)

    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] })
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tasks', 'x'] })
    expect(mocks.removeQueries).toHaveBeenCalledWith({ queryKey: ['projects', 'x'] })
  })

  it('calls custom onSuccess with queryClient', () => {
    const onSuccess = vi.fn<(data: { id: string }, variables: { v: number }, qc: QueryClient) => void>()
    createResourceMutation({
      mutationFn: async () => ({ id: 'x' }),
      errorMessage: 'boom',
      onSuccess,
    })
    const opts = mocks.useMutationMock.mock.calls[0]![0] as unknown as CapturedMutationOptions<{ id: string }, { v: number }>

    opts.onSuccess?.({ id: 'x' }, { v: 1 }, undefined, undefined)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess.mock.calls[0]![0]).toEqual({ id: 'x' })
    expect(onSuccess.mock.calls[0]![1]).toEqual({ v: 1 })
    expect(onSuccess.mock.calls[0]![2]).toMatchObject({
      invalidateQueries: mocks.invalidateQueries,
      removeQueries: mocks.removeQueries,
    })
  })

  it('shows error toast on error', () => {
    createResourceMutation({
      mutationFn: async () => ({ ok: true }),
      errorMessage: 'Could not save',
    })
    const error = new Error('nope')
    const opts = mocks.useMutationMock.mock.calls[0]![0] as unknown as CapturedMutationOptions<{ ok: boolean }, unknown>

    opts.onError?.(error, undefined, undefined, undefined)

    expect(mocks.showErrorToast).toHaveBeenCalledWith('Could not save', error)
  })
})
