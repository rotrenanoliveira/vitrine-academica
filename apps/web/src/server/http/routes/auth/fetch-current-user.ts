'use server'

import { getCurrentUser } from '@/server/auth/require-user'

export async function fetchCurrentUser() {
  return getCurrentUser()
}
