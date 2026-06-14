import { apiClient, apiList } from './client'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export async function getMe(): Promise<User> {
  return apiClient<User>('users/me')
}

export async function getUsersByIDs(ids: string[]): Promise<User[]> {
  if (ids.length === 0) {
    return []
  }

  const params = new URLSearchParams()
  for (const id of ids) {
    params.append('ids', id)
  }
  return apiList<User>(`users?${params.toString()}`)
}

export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  const params = new URLSearchParams({ search: query, limit: String(limit) })
  return apiList<User>(`users?${params.toString()}`)
}
