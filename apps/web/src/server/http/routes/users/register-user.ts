'use server'

import { fetcher } from '@/utils/fetcher'
import type { User } from '@/utils/type'
import { api } from '../../api-client'

type RegisterUserParams = {
  name: string
  email: string
}

export async function registerUser(data: RegisterUserParams) {
  return await fetcher(
    api
      .post<{ user: User }>('api/v1/users', {
        json: data,
      })
      .json(),
  )
}
