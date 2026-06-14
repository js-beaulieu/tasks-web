import { apiClient } from './client'

export interface User {
  id: string
  name: string
  email: string
  preferredIdentity?: string
}

export async function getMe(): Promise<User> {
  return apiClient<User>('users/me')
}
