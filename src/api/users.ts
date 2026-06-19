import { apiClient, apiList } from './client'
import type { ApiUser } from './types'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

function fromApiUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  }
}

export async function getMe(): Promise<User> {
  const user = await apiClient<ApiUser>('users/me')
  return fromApiUser(user)
}

export async function getUsersByIDs(ids: string[]): Promise<User[]> {
  if (ids.length === 0) {
    return []
  }

  const params = new URLSearchParams()
  for (const id of ids) {
    params.append('ids', id)
  }
  const users = await apiList<ApiUser>(`users?${params.toString()}`)
  return users.map(fromApiUser)
}

export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  const params = new URLSearchParams({ search: query, limit: String(limit) })
  const users = await apiList<ApiUser>(`users?${params.toString()}`)
  return users.map(fromApiUser)
}
