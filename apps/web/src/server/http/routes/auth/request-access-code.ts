'use server'

import { fetcher } from '@/utils/fetcher'
import { api } from '../../api-client'

type RequestAccessCodeParams = {
  email: string
}

export async function requestAccessCode(data: RequestAccessCodeParams) {
  return await fetcher(
    api.post('api/v1/auth/access-code', {
      json: data,
    }),
    { notFound: false },
  )
}
