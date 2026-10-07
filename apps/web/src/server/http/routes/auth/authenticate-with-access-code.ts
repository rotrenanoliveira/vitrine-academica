'use server'

import { fetcher } from '@/utils/fetcher'
import type { User } from '@/utils/type'
import { api } from '../../api-client'

type AuthenticateParams = {
  email: string
  code: string
}

export async function authenticateWithAccessCode(data: AuthenticateParams) {
  return await fetcher(
    api
      .post<{ accessToken: string; user: User }>('api/v1/auth/sessions', {
        json: data,
      })
      .json(),
    { notFound: false },
  )
}
