'use server'

import { fetcher } from '@/utils/fetcher'
import type { User } from '@/utils/type'
import { api } from '../../api-client'

export async function getMe() {
  return await fetcher(api.get<{ user: User }>('api/v1/auth/me').json(), { notFound: false })
}
