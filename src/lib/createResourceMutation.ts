import { useMutation, useQueryClient, type QueryClient, type UseMutationOptions } from '@tanstack/vue-query'
import { showErrorToast } from '@/lib/error'

type QueryKey = readonly unknown[]

export interface CreateMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  errorMessage: string
  invalidate?: (data: TData, variables: TVariables) => QueryKey[]
  remove?: (data: TData, variables: TVariables) => QueryKey[]
  onSuccess?: (data: TData, variables: TVariables, queryClient: QueryClient) => void
}

export function createResourceMutation<TData, TVariables>(
  options: CreateMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient()

  const mutationOptions: UseMutationOptions<TData, Error, TVariables> = {
    mutationFn: options.mutationFn,
    onSuccess: (data, variables) => {
      if (options.invalidate) {
        for (const key of options.invalidate(data, variables)) {
          queryClient.invalidateQueries({ queryKey: [...key] })
        }
      }
      if (options.remove) {
        for (const key of options.remove(data, variables)) {
          queryClient.removeQueries({ queryKey: [...key] })
        }
      }
      options.onSuccess?.(data, variables, queryClient)
    },
    onError: (error: Error) => {
      showErrorToast(options.errorMessage, error)
    },
  }

  return useMutation<TData, Error, TVariables>(mutationOptions)
}