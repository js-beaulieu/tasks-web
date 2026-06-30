import { apiList } from './client'

export async function listTags(): Promise<string[]> {
  return apiList<string>('tags')
}
